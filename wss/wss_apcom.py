__author__ = 'wangtao'

import tornado.web
import tornado.websocket
import json
from tornado import gen
from tornado.concurrent import run_on_executor
from concurrent.futures import ThreadPoolExecutor
from wss.base_handle import BaseHandler
from wss.wss_msg import Message
from common.util import *
from common.log import *
import tcelery
import datetime
import time
from task import *
from database.db import *


# receive msg from AP client
class APSideCommHandler(BaseHandler):
    clients = set()
    executor = ThreadPoolExecutor(32)
    msg = None
    # db = None
    lifetime = 300

    def ac_msg_init(self, database):
        self.msg = Message(database)

    @staticmethod
    def ac_send_msg(client, message):
        if message is not None:
            log.logger.info("====send msg[{0}] to client[{1}]====".format(message, str(id(client))))
            try:
                msg_json = {}
                msg_json = json.dumps(message)
                client.write_message(msg_json)
                return True
            except:
                log.logger.error("ac_send_msg error!!!")
        else:
            log.logger.error("message is null!")
        return False

    def ac_get_device_id(self, client):
        if self.redis.exists(client):
            device_id = self.redis.hget(client, "device_id")
            return int(device_id)
        else:
            log.logger.error("can't find client[{0}] from redis!".format(client))
            return None

    def ac_get_client_id(self, device):
        if self.redis.exists(device):
            client_id = self.redis.hget(device, "client_id")
            return int(client_id)
        else:
            log.logger.error("can't find device[{0}] from redis!".format(device))
            return None

    def ac_update_client_lifetime(self, client_id, date_time):
        device_id = self.ac_get_device_id(client_id)
        if device_id:
            log.logger.debug("update device[{0}] lifetime: {1}".format(device_id, self.lifetime))
            self.redis.hset(device_id, "date_time", str(date_time))
            self.redis.expire(client_id, self.lifetime)
            self.redis.expire(device_id, self.lifetime)
        else:
            log.logger.error("update client[{0}] lifetime fail!".format(client_id))

    @with_db_connection
    def ac_offline_device(self, client_id):
        try:
            device_id = self.ac_get_device_id(client_id)
            if device_id:
                self.redis.delete(device_id)
                self.redis.delete(client_id)
            else:
                return False
        except:
            log.logger.error("Set device offline status to redis fail")
        dev_ip = "0.0.0.0"
        try:
            # clear the pm date of device
            client_status = self.db.query("Device_Status_Client", {'dev_id': int(device_id)}, fields=['id'])
            if client_status:
                self.db.delete("Device_Status_Client", {'dev_id': int(device_id)})
            device_pm = self.db.query("Device_Pm_Client", {'dev_id': int(device_id)}, fields=['id'])
            if device_pm:
                self.db.delete("Device_Pm_Client", {'dev_id': int(device_id)})
            # set device offline alarm
            dev_config = self.db.query_one("Device_Config_Basic", {"id": int(device_id)}, fields=['timezone'])
            if dev_config:
                report_time = get_sys_time(dev_config['timezone'])
                self.db.insert("Device_Alarm", {'dev_id': int(device_id), 'dev_alm_action': "set",
                                                'dev_alm_function': "offline", 'dev_alm_time': report_time})
            # set the device status to offline
            dev_status = self.db.query_one("Device_Status_Basic", {'dev_id': int(device_id)},
                                           fields=['dev_state', 'id', 'dev_ip'])
            if dev_status:
                dev_status['dev_state'] = 0
                dev_ip = dev_status['dev_ip']
                key = {'id': dev_status['id']}
                self.db.update("Device_Status_Basic", dev_status, key)
        except:
            log.logger.error("Set device offline status to db fail")
            return False
        log.logger.warning("Device[IP:{0}] [ID:{1}] [client_id:{2}]is offline!!!".format(dev_ip, device_id, client_id))
        return True

    def ac_online_device(self, device_id, client_id, reg_info, online_time):
        try:
            self.redis.hset(device_id, "client_id", client_id)
            self.redis.hset(client_id, "device_id", device_id)
        except:
            log.logger.error("Set device online status to redis fail!")
            return False
        self.ac_update_client_lifetime(client_id, online_time)
        try:
            # clear device offline alarm
            self.db.insert("Device_Alarm", {'dev_id': int(device_id), 'dev_alm_action': "clear",
                                            'dev_alm_function': "offline", 'dev_alm_time': online_time})
            # set device info to device status table
            dev_status = self.db.query_one("Device_Status_Basic", {'dev_id': device_id})
            if dev_status:
                dev_status['boot_ver'] = reg_info['boot_ver']
                dev_status['dev_fw'] = reg_info['firmware']
                dev_status['dev_sw_ver_cur'] = reg_info['sw_ver']
                dev_status['dev_sw_ver_back'] = reg_info['sw_ver_bak']
                dev_status['dev_ip'] = reg_info['apip']
                dev_status['dev_state'] = 1
                dev_status['wan_speed'] = reg_info['wan_speed']
                dev_status['wan_duplex'] = reg_info['wan_duplex']
                dev_status['wan_port_vid'] = reg_info['wan_port_vid']
                dev_status['dev_uptime'] = 0
                dev_status['dev_free_mem'] = 0
                dev_status['dev_last_seen'] = online_time
                dev_status['dev_cpu_utilize'] = 0
                key = {'id': dev_status['id']}
                self.db.update("Device_Status_Basic", dev_status, key)
            else:
                dev_status = {}
                dev_status['dev_id'] = device_id
                dev_status['boot_ver'] = reg_info['boot_ver']
                dev_status['dev_fw'] = reg_info['firmware']
                dev_status['dev_sw_ver_cur'] = reg_info['sw_ver']
                dev_status['dev_sw_ver_back'] = reg_info['sw_ver_bak']
                dev_status['dev_ip'] = reg_info['apip']
                dev_status['dev_state'] = 1
                dev_status['wan_speed'] = reg_info['wan_speed']
                dev_status['wan_duplex'] = reg_info['wan_duplex']
                dev_status['wan_port_vid'] = reg_info['wan_port_vid']
                dev_status['dev_uptime'] = 0
                dev_status['dev_free_mem'] = 0
                dev_status['dev_last_seen'] = online_time
                dev_status['dev_cpu_utilize'] = 0
                self.db.insert("Device_Status_Basic", dev_status)
        except:
            log.logger.error("Set device online status to db fail!")
            return False
        log.logger.info("Device[IP:{0}] [ID:{1}] [client_id:{2}]is online!!!".format(reg_info['apip'],
                                                                                     device_id, client_id))
        return True

    def ac_sync_allCfg2AP(self, client_id):
        dev_id = self.ac_get_device_id(client_id)
        if not dev_id:
            log.logger.error("get device id fail!, can't sync all cfg to client[{0}]".format(client_id))
            return False
        log.logger.info("====sync all cfg to device[{0}]====".format(dev_id))
        for c in APSideCommHandler.clients:
            if id(c) == int(client_id):
                log.logger.debug("find client[{0}] to send!".format(client_id))
                # device basic cfg
                cfg_info = {"op_type": 'Device_Config_Basic', "op_param": dev_id}
                message = self.msg.cfg_msg_gen(dev_id, cfg_info)
                self.ac_send_msg(c, message)
                # device monitor cfg
                cfg_info = {"op_type": 'Device_Config_Basic', "op_param": dev_id, "op_act": "m_update"}
                message = self.msg.cfg_msg_gen(dev_id, cfg_info)
                self.ac_send_msg(c, message)
                # device radio cfg
                radio_cfgs = self.db.query("Device_Config_Radio", {'dev_id': dev_id})
                if radio_cfgs:
                    for radio_cfg in radio_cfgs:
                        cfg_info = {"op_type": 'Device_Config_Radio', "op_param": radio_cfg['id']}
                        message = self.msg.cfg_msg_gen(dev_id, cfg_info)
                        self.ac_send_msg(c, message)
                # device mgmt cfg
                mgmt_cfg = self.db.query_one("Device_Config_Management", {'dev_id': dev_id})
                if mgmt_cfg:
                    cfg_info = {"op_type": 'Device_Config_Management', "op_param": mgmt_cfg['id']}
                    message = self.msg.cfg_msg_gen(dev_id, cfg_info)
                    self.ac_send_msg(c, message)
                # device ssid cfg
                ssid_cfgs = self.db.query("Device_Config_RadioToSsidMapping", {'dev_id': dev_id})
                if ssid_cfgs:
                    for ssid_cfg in ssid_cfgs:
                        cfg_info = {"op_type": 'Device_Config_RadioToSsidMapping', "op_param": ssid_cfg['id'],
                                    "op_param1": 0, "op_act": 'insert'}
                        message = self.msg.cfg_msg_gen(dev_id, cfg_info)
                        self.ac_send_msg(c, message)
                break

    def ac_send_partCfg2AP(self):
        cfg_tasks = self.db.query_all("Operate_Action_FromCgi")
        if cfg_tasks:
            for cfg_task in cfg_tasks:
                log.logger.info("====configure task:{0}====".format(cfg_task))
                device_id = cfg_task['dev_id']
                # according to device id get the session id
                client_id = self.ac_get_client_id(device_id)
                if client_id:
                    for c in APSideCommHandler.clients:
                        if id(c) == client_id:
                            message = self.msg.cfg_msg_gen(device_id, cfg_task)
                            self.ac_send_msg(c, message)
                            break
                else:
                    log.logger.info("can't find session id for device[{0}]!".format(device_id))
                self.db.delete("Operate_Action_FromCgi", {'id': cfg_task['id']})
        else:
            log.logger.info("no any configurations need to be send to ap!")

    def ac_set_pm_data(self, data, dev_id):
        pm = {}
        pm['dev_id'] = dev_id
        rt = data['report_time']
        pm['report_time'] = str(datetime.datetime.strptime(rt, "%a %b %d %H:%M:%S %Y"))
        for i in range(0, 2):
            radio_key = 'radio---' + str(i)
            radio_0 = data[radio_key]
            if radio_0:
                pm['radio_id'] = radio_0['radio_id']
                pm['rx_packets'] = radio_0['rx_pkts']
                pm['rx_bytes'] = radio_0['rx_bytes']
                pm['rx_err_pkts'] = radio_0['rx_err_pkts']
                pm['tx_packets'] = radio_0['tx_pkts']
                pm['tx_packets'] = radio_0['tx_pkts']
                pm['tx_bytes'] = radio_0['tx_bytes']
                pm['tx_retry_pkts'] = radio_0['tx_retry']
                pm['delta_time'] = radio_0['delta_time']
                pm['rx_packets_rate'] = radio_0['rx_rate_pkts']
                pm['rx_bytes_rate'] = radio_0['rx_rate_bytes']
                pm['tx_packets_rate'] = radio_0['tx_rate_pkts']
                pm['tx_bytes_rate'] = radio_0['tx_rate_bytes']
                self.db.insert("Device_Pm_Radio", pm)

    def ac_set_client_data(self, data, dev_id, report_time):
        device_status = self.db.query("Device_Status_Client", {'dev_id': dev_id})
        if device_status:
            self.db.delete("Device_Status_Client", {'dev_id': dev_id})
        device_pm = self.db.query("Device_Pm_Client", {'dev_id': dev_id})
        if device_pm:
            self.db.delete("Device_Pm_Client", {'dev_id': dev_id})
        sta_num = data['num_sta']
        self.db.update("Device_Status_Basic", {"sta_num": sta_num}, {'dev_id': dev_id})
        for i in range(0, sta_num):
            sta_pm = {}
            client_status = {}
            sta_key = 'sta---' + str(i)
            station = data[sta_key]
            sta_mac = station['sta_mac']
            client_status['dev_id'] = dev_id
            client_status['radio_id'] = station['radio_id']
            client_status['ssid_index'] = station['ssid_id']
            ssid_name = station['ssid_name']
            client_status['ssid_name'] = ssid_name
            client_status['sta_mac'] = sta_mac
            client_status['report_time'] = report_time
            client_status['connected_time'] = station['online_time']
            client_status['rssi'] = station['rssi']
            client_sta = self.db.query_one("Device_Status_Client", {"sta_mac": sta_mac}, fields=['id'])
            if client_sta:
                self.db.update("Device_Status_Client", client_status, {"sta_mac": sta_mac})
            else:
                self.db.insert("Device_Status_Client", client_status)

            client = self.db.query_one("Device_Status_Client", {"sta_mac": sta_mac}, fields=['id'])
            if client:
                client_id = client['id']
                sta_pm['dev_id'] = dev_id
                sta_pm['radio_id'] = station['radio_id']
                sta_pm['ssid_index'] = station['ssid_id']
                sta_pm['client_id'] = client_id
                sta_pm['sta_upstream_bytes'] = station['tx_bytes']
                sta_pm['sta_downstream_bytes'] = station['rx_bytes']
                sta_pm['report_time'] = report_time
                client_st = self.db.query_one("Device_Pm_Client", {"client_id": int(client_id)}, fields=['id'])
                if client_st:
                    self.db.update("Device_Pm_Client", sta_pm, {"client_id": client_id})
                else:
                    self.db.insert("Device_Pm_Client", sta_pm)

    def ac_send_reboot_msg(self, msg):
        device_id = msg['value']
        client_id = self.ac_get_client_id(device_id)
        if client_id:
            for c in APSideCommHandler.clients:
                if id(c) == client_id:
                    message = self.msg.opt_msg_gen(None, "reboot")
                    self.ac_send_msg(c, message)
                    break
        else:
            log.logger.info("can't find session id for device[{0}]!".format(device_id))

    def ac_send_del_dev_msg(self, msg):
        device_id = msg['value']
        client_id = self.ac_get_client_id(device_id)
        if client_id:
            for c in APSideCommHandler.clients:
                if id(c) == client_id:
                    message = self.msg.opt_msg_gen(None, "del_dev")
                    self.ac_send_msg(c, message)
                    break
        else:
            log.logger.info("can't find session id for device[{0}]!".format(device_id))

    def ac_send_upgrade_msg(self, dev_id, up_way):
        upgrade_dev_id = "upgrade" + str(dev_id)
        up_ver = self.redis.get(upgrade_dev_id)
        if up_ver:
            log.logger.info("Device[{0}] is still in upgrade process [fw version:{1}]...".format(dev_id, up_ver))
        else:
            up_msg = self.msg.opt_msg_gen(dev_id, up_way)
            if up_msg:
                log.logger.info("{0}: upgrade the fw version[{0}] to Device[{1}]".format(up_way, up_msg['target_ver'], dev_id))
                resp_json = {}
                resp_json = json.dumps(up_msg)
                try:
                    if up_way == "upgrade_manual":
                        client_id = self.ac_get_client_id(dev_id)
                        if client_id:
                            for c in APSideCommHandler.clients:
                                if id(c) == client_id:
                                    ret = self.ac_send_msg(c, up_msg)
                                    if ret is True:
                                        self.redis.set(upgrade_dev_id, up_msg['target_ver'])
                                    break
                        else:
                            log.logger.error("can't get client_id, send upgrade msg error")
                    else:
                        self.write_message(resp_json)
                        self.redis.set(upgrade_dev_id, up_msg['target_ver'])
                except:
                    log.logger.error("send upgrade msg error")

    def ac_clear_upgrade_flag(self, device_id):
        upgrade_dev_id = "upgrade" + str(device_id)
        if self.redis.exists(upgrade_dev_id):
            self.redis.delete(upgrade_dev_id)

    @with_db_connection
    def ac_config_change_msg_handler(self):
        self.ac_send_partCfg2AP()

    @with_db_connection
    def ac_reboot_ap_msg_handler(self, msg):
        self.ac_send_reboot_msg(msg)

    @with_db_connection
    def ac_del_ap_msg_handler(self, msg):
        self.ac_send_del_dev_msg(msg)

    @with_db_connection
    def ac_manual_upgrade_ap_msg_handler(self, msg):
        device_id = msg['value']
        self.ac_send_upgrade_msg(device_id, "upgrade_manual")

    @with_db_connection
    def ap_ready_for_sync_msg_handler(self, client_id):
        self.ac_sync_allCfg2AP(client_id)

    @with_db_connection
    def ap_upgrade_ack_msg_handler(self, up_ack, client_id):
        return_code = up_ack["return_code"]
        if self.msg.APC_AP2AC_UPGRADE_SUCCESS_REBOOTING == return_code:
            device_id = self.ac_get_device_id(client_id)
            if device_id:
                device_cfg = self.db.query_one("Device_Config_Basic", {'id': device_id}, fields=["network_id"])
                if device_cfg:
                    network_cfg = self.db.query_one("System_Config_Network",
                                                    {'id': device_cfg['network_id']}, fields=["up_ok"])
                    if network_cfg:
                        new_up_ok = int(network_cfg['up_ok']) + 1
                        self.db.update("System_Config_Network", {"up_ok": new_up_ok}, {'id': device_cfg['network_id']})
            log.logger.info("Device upgrade successful!")
        elif self.msg.APC_AP2AC_UPGRADE_FAIL_BOOT_IMAGEA_SAVE == return_code:
            log.logger.warning("APC_AP2AC_UPGRADE_FAIL_BOOT_IMAGEA_SAVE")
        elif self.msg.APC_AP2AC_UPGRADE_FAIL_BOOT_VER_CHECK == return_code:
            log.logger.warning("APC_AP2AC_UPGRADE_FAIL_BOOT_VER_CHECK")
        elif self.msg.APC_AP2AC_UPGRADE_FAIL_CHECK_CRC == return_code:
            log.logger.warning("device upgrade fail, CRC error")
        elif self.msg.APC_AP2AC_UPGRADE_FAIL_WRITE_FILE_MD0 == return_code:
            log.logger.warning("APC_AP2AC_UPGRADE_FAIL_WRITE_FILE_MD0")
        elif self.msg.APC_AP2AC_UPGRADE_FAIL_WRITE_FILE_MD4 == return_code:
            log.logger.warning("APC_AP2AC_UPGRADE_FAIL_WRITE_FILE_MD4")
        elif self.msg.APC_AP2AC_UPGRADE_FAIL_TIMEOUT == return_code:
            log.logger.warning("APC_AP2AC_UPGRADE_FAIL_TIMEOUT")
        elif self.msg.APC_AP2AC_UPGRADE_FAIL_WRITE_FILE == return_code:
            log.logger.warning("APC_AP2AC_UPGRADE_FAIL_WRITE_FILE")
        elif self.msg.APC_AP2AC_UPGRADE_FAIL_HW_INFO == return_code:
            log.logger.warning("APC_AP2AC_UPGRADE_FAIL_HW_INFO")
        else:
            log.logger.warning("Device upgrade fail for other reason")
            
        if self.msg.APC_AP2AC_UPGRADE_FAIL_TIMEOUT == return_code \
                or self.msg.APC_AP2AC_UPGRADE_FAIL_CHECK_CRC == return_code \
                or self.msg.APC_AP2AC_UPGRADE_SUCCESS_REBOOTING == return_code:
            device_id = self.ac_get_device_id(client_id)
            if device_id:
                upgrade_dev_id = "upgrade" + str(device_id)
                log.logger.debug("upgrade_dev_id: {0}".format(upgrade_dev_id))
                target_ver = str(self.redis.get(upgrade_dev_id))
                log.logger.debug(target_ver)
                if self.redis.exists(upgrade_dev_id):
                    log.logger.info("reset upgrade flag!!!")
                    self.redis.delete(upgrade_dev_id)

    @with_db_connection
    def ap_rpt_ipinfo_msg_handler(self, ip_info, client_id):
        device_id = self.ac_get_device_id(client_id)
        if device_id:
            cfg = {}
            cfg['dev_id'] = device_id
            cfg['wanport_mode'] = ip_info["wanport_mode"]
            cfg['wanport_vlan'] = ip_info["wanport_vlan"]
            cfg['wanport_detag'] = ip_info["wanport_detag"]
            if cfg['wanport_mode'] != 1:
                cfg['wanport_ip'] = ip_info["wanport_ip"]
                cfg['wanport_netmask'] = ip_info["wanport_netmask"]
                cfg['wanport_gateway'] = ip_info["wanport_gateway"]
                cfg['wanport_dns1'] = ip_info["wanport_dns1"]
                cfg['wanport_dns2'] = ip_info["wanport_dns2"]
                cfg['wanport_detag'] = ip_info["wanport_detag"]
            mgt_cfg = self.db.query_one("Device_Config_Wanport", {"dev_id": device_id})
            cfg["flag"] = 0
            if mgt_cfg:
                self.db.update("Device_Config_Wanport", cfg, {"id": mgt_cfg['id']})
            else:
                self.db.insert("Device_Config_Wanport", cfg)
        else:
            log.logger.error("can't find device id for client[{0}] in redis!".format(client_id))

    @with_db_connection
    def ap_reg_msg_handler(self, reg_info, client_id):
        apsn = reg_info["apsn"]
        hwver = reg_info["hw_ver"]
        mac = reg_info["apmac"]
        key = {"dev_sn": apsn}
        reg_result = False
        reason = 0
        del reg_info['msg_type']
        dev_config = self.db.query_one("Device_Config_Basic", key)
        # check the device sn
        if dev_config:
            dev_type_id = dev_config['dev_type_id']
            dev_type = self.db.query_one("Device_Type_Define", {'id': dev_type_id})
            if dev_type:
                dev_feature_code = dev_type['dev_feature_code']
                dev_mac = dev_config['dev_mac']
                # check the device feature code
                if dev_feature_code == hwver:
                    # check the device mac address
                    if dev_mac.lower() == mac.lower():
                        device_id = dev_config['id']
                        online_time = get_sys_time(dev_config['timezone'])
                        if self.ac_online_device(device_id, client_id, reg_info, online_time):
                            log.logger.info("====Device[{0}] [ID:{1}] [SN:{2}] registered successful!====".format(dev_config['dev_name'], device_id, apsn))
                            reg_result = True
                    else:
                        log.logger.info("====Device[SN:{0}]registered fail, [MAC:{1}] is invalid!====".format(apsn, mac))
                        reason = self.msg.APC_AP2AC_REG_FAIL_INVALID_MAC
                else:
                    log.logger.info("====Device[SN:{0}]registered fail, [feature_code:{1}] is invalid!====".format(apsn, hwver))
                    reason = self.msg.APC_AP2AC_REG_FAIL_INVALID_HW
        else:
            log.logger.info("====Unknown Device, can't find SN[{0}] in db!====".format(apsn))
            reason = self.msg.APC_AP2AC_REG_FAIL_INVALID_SN
        if dev_config:
            msg = self.msg.reg_ack_msg_gen(reg_result, reason, dev_config['id'])
        else:
            msg = self.msg.reg_ack_msg_gen(reg_result, reason, None)
        try:
            resp_json = json.dumps(msg)
            self.write_message(resp_json)
        except:
            log.logger.error("send reg ack msg fail!")
        if reg_result:
            try:
                network_id = dev_config['network_id']                
                self.ac_clear_upgrade_flag(device_id)
            except:
                log.logger.error("clear upgrade flag fail!")
            cfg_info = {"op_type": 'Device_Config_Basic', "op_param": dev_config['id'], "op_act": "m_update"}
            msg = self.msg.cfg_msg_gen(dev_config['id'], cfg_info)
            try:
                resp_json = json.dumps(msg)
                self.write_message(resp_json)
            except:
                log.logger.error("send monitor cfg msg fail!")
            """
            after device register successful,if dev_data_sync < ac_data_sync,
            need update the device configuration.
            """
            dev_status = self.db.query_one("Device_Status_Basic", {'dev_id': device_id})
            if dev_status:
                try:
                    ac_data_sync = dev_status['dev_data_sync']
                    dev_data_sync = reg_info['data_sync']
                    if int(ac_data_sync) != int(dev_data_sync):
                        msg = self.msg.ready_for_sync_cfg_msg_gen()
                        self.ac_send_msg(self, msg)
                        # self.ac_sync_allCfg2AP(device_id, client_id)
                except:
                    log.logger.error("AC sync all configuration with AP fail!")

    @with_db_connection
    def ap_hb_msg_handler(self, hb_info, client_id):
        dev_id = self.ac_get_device_id(client_id)
        if dev_id:
            report_time = str(datetime.datetime.strptime(hb_info['report_time'], "%a %b %d %H:%M:%S %Y"))
            self.ac_update_client_lifetime(client_id, report_time)
            dev_status = self.db.query_one("Device_Status_Basic", {'dev_id': dev_id},
                                           fields=['dev_data_sync', 'dev_state'])
            if dev_status and dev_status['dev_state'] == 1:
                dev_data_sync = hb_info['data_sync']
                if "cpu_util" in hb_info.keys():
                    if hb_info["cpu_util"]:
                        self.db.update("Device_Status_Basic", {'dev_cpu_utilize': hb_info["cpu_util"]},
                                       {'dev_id': dev_id})
                    else:
                        log.logger.debug("cpu_util is no data in hb msg")
                if "dev_uptime" in hb_info.keys():
                    if hb_info["dev_uptime"]:
                        self.db.update("Device_Status_Basic", {'dev_uptime': hb_info["dev_uptime"]},
                                       {'dev_id': dev_id})
                    else:
                        log.logger.debug("dev_uptime is no data in hb msg")
                # get the pm info form hb message, then set pm to database
                if "pm_switch" in hb_info.keys():
                    if hb_info["pm_switch"] == 1:
                        self.ac_set_pm_data(hb_info, dev_id)
                    if hb_info["sta_list_switch"] == 1:
                        self.ac_set_client_data(hb_info, dev_id, report_time)
                    else:
                        log.logger.debug("pm info is disabled in hb msg")
                else:
                    log.logger.error("get pm info from hb msg fail!")
                msg = self.msg.hb_ack_msg_gen()
                self.ac_send_msg(self, msg)
                try:
                    ac_data_sync = dev_status['dev_data_sync']
                    if int(ac_data_sync) != int(dev_data_sync):
                        msg = self.msg.ready_for_sync_cfg_msg_gen()
                        self.ac_send_msg(self, msg)
                        # self.ac_sync_allCfg2AP(dev_id, client_id)
                except:
                    log.logger.error("AC sync all configuration with device fail!")
                self.ac_send_upgrade_msg(dev_id, "upgrade_auto")
            else:
                log.logger.warning("Device state is offline, kick device[ID:{0}] away!".format(dev_id))
                msg = self.msg.sys_error_msg_gen(self.msg.APC_AC2AP_SYS_DEV_STATE_INVALID)
                self.ac_send_msg(self, msg)
                self.ac_offline_device(client_id)
                self.close()
        else:
            log.logger.warning("Device id is not in redis, kick client_id[{0}] away!".format(client_id))
            msg = self.msg.sys_error_msg_gen(self.msg.APC_AC2AP_SYS_DEV_STATE_INVALID)
            self.ac_send_msg(self, msg)
            self.ac_offline_device(client_id)
            self.close()

    @run_on_executor
    def ap_msg_handler(self, message, client_id):
        log.logger.debug("message:{0}".format(message))
        if self.db:
            try:
                msg_dict = json.loads(message)
                msg_type = msg_dict['msg_type']
                if msg_type == self.msg.APC_AP2AC_MSG_REG_CFG_INFO:
                    log.logger.info("Msg type: APC_AP2AC_MSG_REG_CFG_INFO")
                    self.ap_reg_msg_handler(msg_dict, client_id)
                elif msg_type == self.msg.APC_AP2AC_MSG_HB:
                    log.logger.info("Msg type: APC_AP2AC_MSG_HB")
                    self.ap_hb_msg_handler(msg_dict, client_id)
                elif msg_type == self.msg.APC_AP2AC_MSG_OPT_UPGRADE_ACK:
                    log.logger.info("Msg type: APC_AP2AC_MSG_OPT_UPGRADE_ACK")
                    self.ap_upgrade_ack_msg_handler(msg_dict, client_id)
                elif msg_type == self.msg.APC_AC2AP_MSG_RPT_TCPIP:
                    log.logger.info("Msg type: APC_AC2AP_MSG_RPT_TCPIP")
                    self.ap_rpt_ipinfo_msg_handler(msg_dict, client_id)
                elif msg_type == self.msg.APC_AC2AP_MSG_READY_FOR_SYNC_CFG_ACK:
                    log.logger.info("Msg type: APC_AC2AP_MSG_READY_FOR_SYNC_CFG_ACK")
                    self.ap_ready_for_sync_msg_handler(client_id)
                elif msg_type == "cfg_change":
                    self.ac_config_change_msg_handler()
                elif msg_type == "opt_reboot":
                    self.ac_reboot_ap_msg_handler(msg_dict)
                elif msg_type == "opt_del":
                    self.ac_del_ap_msg_handler(msg_dict)
                elif msg_type == "opt_upgrade":
                    self.ac_manual_upgrade_ap_msg_handler(msg_dict)
                else:
                    log.logger.error("Unknown msg type!")
                    msg = self.msg.unknown_msg_type_gen()
                    self.ac_send_msg(self, msg)
                    self.close()
            except:
                log.logger.error("other error!")
                msg = self.msg.sys_error_msg_gen(self.msg.APC_AC2AP_SYS_OTHER_REASON)
                self.ac_send_msg(self, msg)
                self.close()
        else:
            log.logger.error("db is null!")
            msg = self.msg.sys_error_msg_gen(self.msg.APC_AC2AP_SYS_DB_ERROR)
            self.ac_send_msg(self, msg)
            self.close()

    @run_on_executor
    def ap_offline_event_handler(self, client_id):
        self.ac_offline_device(client_id)

    @tornado.gen.coroutine
    def on_message(self, message):
        client_id = str(id(self))
        log.logger.info("Receive message from client[{0}]:".format(client_id))
        yield self.ap_msg_handler(message, client_id)

    def open(self):
        client_id = str(id(self))
        log.logger.info("Device client[{0}] is connected".format(client_id))
        APSideCommHandler.clients.add(self)

    @tornado.gen.coroutine
    def on_close(self):
        APSideCommHandler.clients.remove(self)
        client_id = str(id(self))
        log.logger.info("Client[{0}] is disconnected".format(client_id))
        yield self.ap_offline_event_handler(client_id)
