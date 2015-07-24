__author__ = 'wangtao'


import task.util
from task.util import *
import csv

"""
Device get/set/add/del function
"""


@app.task
def get_device_info_search_task(network, device_name_search):
    db = connectDB()
    if db is not None:
        device_network_infos = []
        network_cfg = db.query_one("System_Config_Network", {'network_name': network})
        if network_cfg:
            device_cfgs = db.query("Device_Config_Basic", {"network_id": network_cfg['id']},search_info_item="dev_name|dev_mac|dev_sn", search_info=device_name_search)
            if device_cfgs:
                for device_cfg in device_cfgs:
                    device_info = {}
                    device_info['data_type'] = "device"
                    device_info['dev_id'] = device_cfg['id']
                    device_info['dev_name'] = device_cfg['dev_name']
                    device_info['dev_sn'] = device_cfg['dev_sn']
                    device_info['dev_mac'] = device_cfg['dev_mac']
                    device_type = db.query_one("Device_Type_Define", {'id': device_cfg['dev_type_id']})
                    if device_type:
                       # device_info['model_name'] = device_type['model_name']
                        device_info['dev_vendor'] = device_type['dev_vendor']
                    else:
                        #device_info['model_name'] = "none"
                        device_info['dev_vendor'] = "none"
                        device_info['network_name'] = "none"
                    device_stat = db.query_one("Device_Status_Basic", {'dev_id': device_cfg['id']})
                    if device_stat:
                        device_info['dev_state'] = device_stat['dev_state']
                    else:
                        device_info['dev_state'] = 0
                    device_map = db.query_one("Device_Config_Map", {'dev_id': device_cfg['id']})
                    if device_map:
                        device_info['map_marker'] = 1
                        device_info['longitude'] = device_map['dev_longitude']
                        device_info['latitude'] = device_map['dev_latitude']
                        device_info['floor_id'] = device_map['floor_id']
                    else:
                        device_info['map_marker'] = 0
                        device_info['longitude'] = 0
                        device_info['latitude'] = 0
                        device_info['floor_id'] = 0
                    device_network_infos.append(device_info)
        else:
            log.logger.debug("network_cfg is null")

        closeDB(db)
        if len(device_network_infos) == 0:
            return None
        else:
            log.logger.debug("device_infos {0}".format(device_network_infos))
            return device_network_infos
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_device_info_task(network, start, offset):
    db = connectDB()
    if db is not None:
        device_network_infos = []
        network_cfg = db.query_one("System_Config_Network", {'network_name': network})
        if network_cfg:
            total_num = db.query_records_num("Device_Config_Basic", {"network_id": network_cfg['id']})
            record_info = {}
            record_info['data_type'] = "summary"
            if total_num:
                record_info['total'] = total_num
            else:
                record_info['total'] = 0
            record_info['start'] = start
            record_info['offset'] = offset
            device_network_infos.append(record_info)
            device_cfgs = db.query("Device_Config_Basic", {"network_id": network_cfg['id']}, start=start, offset=offset)
            if device_cfgs:
                for device_cfg in device_cfgs:
                    device_info = {}
                    device_info['data_type'] = "device"
                    device_info['dev_id'] = device_cfg['id']
                    device_info['dev_name'] = device_cfg['dev_name']
                    device_info['dev_sn'] = device_cfg['dev_sn']
                    device_info['dev_mac'] = device_cfg['dev_mac']
                    device_type = db.query_one("Device_Type_Define", {'id': device_cfg['dev_type_id']})
                    if device_type:
                       # device_info['model_name'] = device_type['model_name']
                        device_info['cap_2g_chain'] = device_type['cap_2g_chain']
                        device_info['cap_5g_chain'] = device_type['cap_5g_chain']
                        device_info['dev_vendor'] = device_type['dev_vendor']
                    else:
                        #device_info['model_name'] = "none"
                        device_info['dev_vendor'] = "none"
                        device_info['network_name'] = "none"
                    device_stat = db.query_one("Device_Status_Basic", {'dev_id': device_cfg['id']})
                    if device_stat:
                        device_info['dev_state'] = device_stat['dev_state']
                    else:
                        device_info['dev_state'] = 0
                    device_map = db.query_one("Device_Config_Map", {'dev_id': device_cfg['id']})
                    if device_map:
                        device_info['map_marker'] = 1
                        device_info['longitude'] = device_map['dev_longitude']
                        device_info['latitude'] = device_map['dev_latitude']
                        device_info['floor_id'] = device_map['floor_id']
                    else:
                        device_info['map_marker'] = 0
                        device_info['longitude'] = 0
                        device_info['latitude'] = 0
                        device_info['floor_id'] = 0
                    device_network_infos.append(device_info)
            device_network_infos = append_ssid_list_data(device_network_infos, db, network)
        else:
            log.logger.debug("network_cfg is null")

        closeDB(db)
        if len(device_network_infos) == 0:
            return None
        else:
            log.logger.debug("device_infos {0}".format(device_network_infos))
            return device_network_infos
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_network_name_list_task():
    db = connectDB()
    if db is not None:
        network_name_list = []
        network__name_list = append_network_data(network_name_list, db)
        closeDB(db)
        if len(network_name_list) != 0:
            return network_name_list
        else:
            return None
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_device_type_task():
    db = connectDB()
    if db is not None:
        dev_type_list = []
        device_types = db.query_all("Device_Type_Define")
        if device_types:
            for device_type in device_types:
                devType_dict = {}
                devType_dict['dev_type'] = device_type['dev_model']
                dev_type_list.append(devType_dict)

        dev_type_list = append_network_data(dev_type_list, db)
        closeDB(db)
        if len(dev_type_list) != 0:
            return dev_type_list
        else:
            return None
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_device_list_task(network, start, offset):
    db = connectDB()
    if db is not None:
        dev_name_list = []
        network_cfg = db.query_one("System_Config_Network", {'network_name': network})
        if network_cfg:
            total_num = db.query_records_num("Device_Config_Basic", {"network_id": network_cfg['id']})
            record_info = {}
            record_info['data_type'] = "summary"
            if total_num:
                record_info['total'] = total_num
            else:
                record_info['total'] = 0
            record_info['start'] = start
            record_info['offset'] = offset
            dev_name_list.append(record_info)
            device_cfgs = db.query("Device_Config_Basic", {"network_id": network_cfg['id']}, start=start, offset=offset)
            if device_cfgs:
                for dev_cfg in device_cfgs:
                    dev_dict = {}
                    dev_dict['data_type'] = "dev_list"
                    dev_dict['dev_name'] = dev_cfg['dev_name']
                    dev_dict['dev_id'] = dev_cfg['id']
                    dev_name_list.append(dev_dict)
            else:
                log.logger.debug("device_cfgs is null")
        else:
            log.logger.debug("network_cfg is null")
        closeDB(db)
        if len(dev_name_list) != 0:
            return dev_name_list
        else:
            return None
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_device_list_search_task_task(network, device_name_search):
    db = connectDB()
    if db is not None:
        dev_name_list = []
        network_cfg = db.query_one("System_Config_Network", {'network_name': network})
        if network_cfg:
            device_cfgs = db.query("Device_Config_Basic", {"network_id": network_cfg['id']}, search_info_item="dev_name|dev_mac|dev_sn", search_info=device_name_search)
            if device_cfgs:
                for dev_cfg in device_cfgs:
                    dev_dict = {}
                    dev_dict['data_type'] = "dev_list"
                    dev_dict['dev_name'] = dev_cfg['dev_name']
                    dev_dict['dev_id'] = dev_cfg['id']
                    dev_name_list.append(dev_dict)
            else:
                log.logger.debug("device_cfgs is null")
        else:
            log.logger.debug("network_cfg is null")
        closeDB(db)
        if len(dev_name_list) != 0:
            return dev_name_list
        else:
            return None
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_radio2ssid_task(network, device):
    db = connectDB()
    if db is not None:
        radio2ssid_list = []
        network_cfg = db.query_one("System_Config_Network", {'network_name': network})
        if network_cfg:
            network_id = network_cfg['id']
            dev_cfg = db.query_one("Device_Config_Basic", {'dev_name': device})
            if dev_cfg:
                dev_id = dev_cfg['id']
                dev_type = db.query_one("Device_Type_Define", {'id': dev_cfg['dev_type_id']})
                dev_ssid_num = {}
                if dev_type:
                    dev_ssid_num['data_type'] = "ssid_num"
                    dev_ssid_num['cap_2g_ssids'] = dev_type['cap_2g_ssid_num']
                    dev_ssid_num['cap_5g_ssids'] = dev_type['cap_5g_ssid_num']
                radio_cfgs = db.query("Device_Config_Radio", {'dev_id': dev_id})
                if radio_cfgs:
                    for radio_cfg in radio_cfgs:
                        if radio_cfg['radio_type'] == "2.4g":
                            radio_2g_id = radio_cfg['id']
                            radio2ssid_cfgs = db.query("Device_Config_RadioToSsidMapping",
                                                       {'dev_id': dev_id, 'network_id': network_id,
                                                        "radio_id": radio_2g_id})
                            if radio2ssid_cfgs:
                                for cfg in radio2ssid_cfgs:
                                    radio2ssid_dict = {}
                                    radio2ssid_dict['data_type'] = "radio2ssid"
                                    radio2ssid_dict['ssid_index'] = cfg['ssid_index']
                                    radio2ssid_dict['ssid_vlan'] = cfg['ssid_vlan_id']
                                    radio2ssid_dict['radio_type'] = "2.4g"
                                    ssid_tp_cfg = db.query_one("Device_Config_SsidTemplate",
                                                               {'id': cfg['ssid_template_id']})
                                    if ssid_tp_cfg:
                                        radio2ssid_dict['ssid_name'] = ssid_tp_cfg['ssid_name']
                                        radio2ssid_list.append(radio2ssid_dict)
                        elif radio_cfg['radio_type'] == "5g":
                            radio_5g_id = radio_cfg['id']
                            radio2ssid_cfgs = db.query("Device_Config_RadioToSsidMapping",
                                                       {'dev_id': dev_id, 'network_id': network_id,
                                                        "radio_id": radio_5g_id})
                            if radio2ssid_cfgs:
                                for cfg in radio2ssid_cfgs:
                                    radio2ssid_dict = {}
                                    radio2ssid_dict['data_type'] = "radio2ssid"
                                    radio2ssid_dict['ssid_index'] = cfg['ssid_index']
                                    radio2ssid_dict['ssid_vlan'] = cfg['ssid_vlan_id']
                                    radio2ssid_dict['radio_type'] = "5g"
                                    ssid_tp_cfg = db.query_one("Device_Config_SsidTemplate",
                                                               {'id': cfg['ssid_template_id']})
                                    if ssid_tp_cfg:
                                        radio2ssid_dict['ssid_name'] = ssid_tp_cfg['ssid_name']
                                        radio2ssid_list.append(radio2ssid_dict)
                    radio2ssid_list.append(dev_ssid_num)
                    radio2ssid_list = append_ssid_list_data(radio2ssid_list, db, network)
        closeDB(db)
        if len(radio2ssid_list) != 0:
            log.logger.debug("radio2ssid_list: {0}".format(radio2ssid_list))
            return radio2ssid_list
        else:
            return None
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_device_cfg_task(network, device):
    db = connectDB()
    if db is not None:
        network_cfg = db.query_one("System_Config_Network", {'network_name': network})
        if network_cfg:
            network_id = network_cfg['id']
            dev_cfg_list = []
            support_2g = 0
            support_5g = 0
            dev_cfgs = db.query("Device_Config_Basic", {'network_id': network_id})
            if dev_cfgs:
                for dev_cfg in dev_cfgs:
                    dev_cfg_dict = {}
                    dev_cfg_dict['data_type'] = "config"
                    dev_cfg_dict['dev_name'] = dev_cfg['dev_name']
                    dev_cfg_dict['dev_sn'] = dev_cfg['dev_sn']
                    if dev_cfg['dev_name'] == device:
                        #auto_upgrade
                        dev_cfg_dict['auto_upgrade'] = dev_cfg['auto_upgrade']
                        dev_cfg_dict['plan_version'] = dev_cfg['plan_version']
                        dev_cfg_dict['firmware_list'] = ''
                        firmware_lists = db.query("Device_Firmware_FileMgmt", {'dev_type_id': dev_cfg['dev_type_id'],'domain_id':network_cfg['domain_id']})
                        if firmware_lists:
                            for firmware_list in firmware_lists:
                                dev_cfg_dict['firmware_list'] += firmware_list['fimware_ver']+'|'
                        # device basic cfg
                        dev_cfg_dict['dev_mac'] = dev_cfg['dev_mac']
                        dev_cfg_dict['country_code'] = dev_cfg['country_code']
                        dev_cfg_dict['timezone'] = dev_cfg['timezone']
                        dev_type = db.query_one("Device_Type_Define", {'id': dev_cfg['dev_type_id']})
                        if dev_type:
                            dev_cfg_dict['dev_vendor'] = dev_type['dev_vendor']
                            dev_cfg_dict['model_name'] = dev_type['model_name']
                            support_2g = dev_type['cap_2g_chain']
                            support_5g = dev_type['cap_5g_chain']
                            if support_2g != 0:
                                dev_cfg_dict['tx_2g_pwr_min'] = dev_type['cap_2g_tx_power_min']
                                dev_cfg_dict['tx_2g_pwr_max'] = dev_type['cap_2g_tx_power_max']
                                dev_cfg_dict["cap_2g_mode"] = dev_type['cap_2g_service_mode']
                                dev_cfg_dict["cap_2g_80211_mode"] = dev_type['cap_2g_80211_mode']
                                dev_cfg_dict["cap_2g_band"] = dev_type['cap_2g_band_width']
                            if support_5g != 0:
                                dev_cfg_dict['tx_5g_pwr_min'] = dev_type['cap_5g_tx_power_min']
                                dev_cfg_dict['tx_5g_pwr_max'] = dev_type['cap_5g_tx_power_max']
                                dev_cfg_dict["cap_5g_mode"] = dev_type['cap_5g_service_mode']
                                dev_cfg_dict["cap_5g_80211_mode"] = dev_type['cap_5g_80211_mode']
                                dev_cfg_dict["cap_5g_band"] = dev_type['cap_5g_band_width']
                        dev_cfg_dict["support_2g"] = support_2g
                        dev_cfg_dict["support_5g"] = support_5g
                        dev_stat = db.query_one("Device_Status_Basic", {'dev_id': dev_cfg['id']})
                        if dev_stat:
                            dev_cfg_dict['dev_sw_ver'] = dev_stat['dev_sw_ver_cur']
                            dev_cfg_dict['dev_ip'] = dev_stat['dev_ip']
                            dev_cfg_dict['dev_state'] = dev_stat['dev_state']
                        dev_mgt = db.query_one("Device_Config_Management", {'dev_id': dev_cfg['id']})
                        if dev_mgt:
                            dev_cfg_dict['mgmt_ssh'] = dev_mgt['mgmt_ssh']
                            dev_cfg_dict['mgmt_user'] = dev_mgt['mgmt_user']
                            dev_cfg_dict['mgmt_password'] = dev_mgt['mgmt_password']

                        # device radio cfg
                        dev_radios = db.query("Device_Config_Radio", {'dev_id': dev_cfg['id']})
                        if dev_radios:
                            for dev_radio in dev_radios:
                                if dev_radio['radio_type'] == '2.4g':
                                    dev_cfg_dict['dev_2g_radio_role'] = dev_radio['service_mode']
                                    dev_cfg_dict['dev_2g_80211_mode'] = dev_radio['80211_mode']
                                    dev_cfg_dict['dev_2g_chan'] = dev_radio['channel']
                                    dev_cfg_dict['dev_2g_txpwr'] = dev_radio['tx_power']
                                    dev_cfg_dict['dev_2g_band'] = dev_radio['bandwith']
                                elif dev_radio['radio_type'] == '5g':
                                    dev_cfg_dict['dev_5g_radio_role'] = dev_radio['service_mode']
                                    dev_cfg_dict['dev_5g_80211_mode'] = dev_radio['80211_mode']
                                    dev_cfg_dict['dev_5g_chan'] = dev_radio['channel']
                                    dev_cfg_dict['dev_5g_txpwr'] = dev_radio['tx_power']
                                    dev_cfg_dict['dev_5g_band'] = dev_radio['bandwith']
                        dev_channel_list = db.query("Device_Country_Channel_Define",
                                                    {"country_code": dev_cfg['country_code']})
                        if dev_channel_list:
                            for dev_channel in dev_channel_list:
                                if support_2g and dev_channel['radio_type'] == '2.4g':
                                    dev_cfg_dict['channel_2g_list'] = dev_channel['channel_list']
                                elif support_5g and dev_channel['radio_type'] == '5g':
                                    dev_cfg_dict['channel_5g_list'] = dev_channel['channel_list']
                        country_list = db.query("Device_Country_Channel_Define", {"radio_type": '2.4g'})
                        if country_list:
                            country_list_str = ""
                            for country in country_list:
                                country_list_str += country['country_code']
                                country_list_str += ","
                            dev_cfg_dict['country_list'] = country_list_str

                        # device tcp/ip cfg
                        dev_ip_cfg = db.query_one("Device_Config_Wanport", {'dev_id': dev_cfg['id']})
                        if dev_ip_cfg:
                            dev_cfg_dict['ip_mode'] = dev_ip_cfg['wanport_mode']
                            dev_cfg_dict['ip_vlan'] = dev_ip_cfg['wanport_vlan']
                            dev_cfg_dict['ip_addr'] = dev_ip_cfg['wanport_ip']
                            dev_cfg_dict['ip_mask'] = dev_ip_cfg['wanport_netmask']
                            dev_cfg_dict['ip_gw'] = dev_ip_cfg['wanport_gateway']
                            dev_cfg_dict['ip_dns1'] = dev_ip_cfg['wanport_dns1']
                            dev_cfg_dict['ip_dns2'] = dev_ip_cfg['wanport_dns2']
                            dev_cfg_dict['ip_detag'] = dev_ip_cfg['wanport_detag']

                        # device advanced cfg
                        dev_mgmt_cfg = db.query_one("Device_Config_Management", {'dev_id': dev_cfg['id']})
                        if dev_mgmt_cfg:
                            dev_cfg_dict['mgmt_ssh'] = dev_mgmt_cfg['mgmt_ssh']
                            dev_cfg_dict['mgmt_http'] = dev_mgmt_cfg['mgmt_http']
                            dev_cfg_dict['mgmt_https'] = dev_mgmt_cfg['mgmt_https']
                            dev_cfg_dict['mgmt_telnet'] = dev_mgmt_cfg['mgmt_telnet']
                            dev_cfg_dict['mgmt_syslog'] = dev_mgmt_cfg['mgmt_syslog']
                            dev_cfg_dict['mgmt_syslog_server'] = dev_mgmt_cfg['mgmt_syslog_server']

                        dev_cfg_list.append(dev_cfg_dict)
                        break
            if len(dev_cfg_list) != 0:
                log.logger.debug("dev_cfg_list: {0}".format(dev_cfg_list))
                closeDB(db)
                return dev_cfg_list
            else:
                closeDB(db)
                return None
        else:
            closeDB(db)
            return None
    else:
        log.logger.error("db is none!")
        return None


@app.task
def add_many_devices_cfg_task(filepath, network_name):
    db = connectDB()
    ret = False
    if db is None:
        log.logger.error("db is none!")
        return ret

    if filepath is not None:
        csvReader = csv.reader(open(filepath, 'r'))
        if csvReader:
            network = db.query_one("System_Config_Network", {'network_name': network_name})
            if network is None:
                log.logger.error("add devices error! network is null")
                return ret
            auto_upgrade = network['auto_upgrade']
            domain_cfg = db.query_one("System_Config_Domain", {'id': network['domain_id']})
            if domain_cfg:
                country_code = domain_cfg['country_code']
                timezone = domain_cfg['timezone']
            else:
                log.logger.error("add devices error! domain cfg is null")
                return ret
            device_cfg_list = []
            dev_sn_dict = {}
            dev_sn_list = []
            device_radio_list = []
            for row in csvReader:
                length = len(row)
                if length == 3:
                    dev_model = row[0]
                    dev_sn = row[1]
                    dev_mac = row[2]
                    dev_name = dev_model + "_" + dev_mac
                    device_type = db.query_one("Device_Type_Define", {'dev_model': dev_model})
                    if device_type is None:
                        log.logger.error("add device error! device model[{0}] is unknown".format(dev_model))
                        continue
                    dev_type_id = device_type['id']
                    network_id = network['id']
                    dev_2g_radio_cfg = {}
                    if device_type['cap_2g_chain'] != 0:
                        dev_2g_radio_cfg['radio_type'] = "2.4g"
                        dev_2g_radio_cfg['dev_sn'] = dev_sn
                        dev_2g_radio_cfg['radio_enable'] = 1
                        support_2g_ap = (int(device_type['cap_2g_service_mode']) >> 0) & 1
                        if support_2g_ap:
                            dev_2g_radio_cfg['service_mode'] = "AP"
                        else:
                            dev_2g_radio_cfg['service_mode'] = "Station"
                        dev_2g_radio_cfg['80211_mode'] = "802.11n"
                        dev_2g_radio_cfg['channel'] = 0
                        dev_2g_radio_cfg['bandwith'] = 20
                        dev_2g_radio_cfg['tx_power'] = 21
                        device_radio_list.append(dev_2g_radio_cfg)
                    dev_5g_radio_cfg = {}
                    if device_type['cap_5g_chain'] != 0:
                        dev_5g_radio_cfg['radio_type'] = "5g"
                        dev_5g_radio_cfg['dev_sn'] = dev_sn
                        dev_5g_radio_cfg['radio_enable'] = 1
                        support_5g_ap = (int(device_type['cap_5g_service_mode']) >> 0) & 1
                        if support_5g_ap:
                            dev_5g_radio_cfg['service_mode'] = "AP"
                        else:
                            dev_5g_radio_cfg['service_mode'] = "Station"
                        dev_5g_radio_cfg['80211_mode'] = "802.11n"
                        dev_5g_radio_cfg['channel'] = 0
                        dev_5g_radio_cfg['bandwith'] = 40
                        dev_5g_radio_cfg['tx_power'] = 21
                        device_radio_list.append(dev_5g_radio_cfg)
                    device_cfg = (dev_name, dev_sn, dev_mac, country_code, timezone,  network_id, dev_type_id,
                                  auto_upgrade)
                    log.logger.debug("device_cfg: {0}".format(device_cfg))
                    device_cfg_list.append(device_cfg)
                    dev_sn_list.append(dev_sn)
                else:
                    log.logger.error("add device error! device information is incomplete")
            if len(device_cfg_list) != 0:
                names = ['dev_name', 'dev_sn', 'dev_mac', 'country_code', 'timezone', 'network_id',
                         'dev_type_id', 'auto_upgrade']
                ret = db.insert_many("Device_Config_Basic", names, device_cfg_list)
                if ret is True:
                    dev_sn_dict['dev_sn'] = dev_sn_list
                    log.logger.debug("dev_sn_dict:{0}".format(dev_sn_dict))
                    device_cfgs = db.query("Device_Config_Basic", dev_sn_dict, is_and=False)
                    if device_cfgs:
                        length = len(device_radio_list)
                        device_radio_cfgs = []
                        for device in device_cfgs:
                            for i in range(0, length):
                                if 'dev_sn' in device_radio_list[i].keys() \
                                        and device_radio_list[i]['dev_sn'] == device['dev_sn']:
                                    dev_radio_dict = {}
                                    dev_radio_dict = device_radio_list[i]
                                    del dev_radio_dict['dev_sn']
                                    dev_radio_dict['dev_id'] = device['id']
                                    names = list(dev_radio_dict.keys())
                                    device_radio_cfgs.append(tuple(dev_radio_dict.values()))
                        if len(device_radio_cfgs) != 0:
                            ret = db.insert_many("Device_Config_Radio", names, device_radio_cfgs)
                    else:
                        log.logger.debug("device_cfgs is null!")
            else:
                ret = False
        else:
            log.logger.error("open csv file error!")
    else:
        log.logger.error("file is null!")
    if os.path.exists(filepath):
        os.remove(filepath)
    closeDB(db)
    return ret


@app.task
def add_device_cfg_task(cfg):
    db = connectDB()
    if db is not None:
        network = db.query_one("System_Config_Network", {'network_name': cfg['network_name']})
        device_type = db.query_one("Device_Type_Define", {'dev_model': cfg['dev_model']})
        if network and device_type:
            device_name = cfg['dev_model'] + "_" + cfg['dev_mac']
            cfg['dev_name'] = device_name
            cfg['network_id'] = network['id']
            cfg['dev_type_id'] = device_type['id']
            domain_cfg = db.query_one("System_Config_Domain", {'id': network['domain_id']})
            if domain_cfg:
                cfg['country_code'] = domain_cfg['country_code']
                cfg['timezone'] = domain_cfg['timezone']
            else:
                log.logger.error("domain cfg is null")
            del cfg['network_name']
            del cfg['dev_model']
            cfg['auto_upgrade'] = network['auto_upgrade']
            ret = db.insert("Device_Config_Basic", cfg)
            if ret is False:
                closeDB(db)
                return ret
            dev_basic_cfg = db.query_one("Device_Config_Basic", {"dev_name": device_name})
            if dev_basic_cfg:
                dev_2g_radio_cfg = {}
                if device_type['cap_2g_chain'] != 0:
                    dev_2g_radio_cfg['radio_type'] = "2.4g"
                    dev_2g_radio_cfg['dev_id'] = dev_basic_cfg['id']
                    dev_2g_radio_cfg['radio_enable'] = 1
                    support_2g_ap = (int(device_type['cap_2g_service_mode']) >> 0) & 1
                    if support_2g_ap:
                        dev_2g_radio_cfg['service_mode'] = "AP"
                    else:
                        dev_2g_radio_cfg['service_mode'] = "Station"
                    dev_2g_radio_cfg['80211_mode'] = "802.11n"
                    dev_2g_radio_cfg['channel'] = 0
                    dev_2g_radio_cfg['bandwith'] = 20
                    dev_2g_radio_cfg['tx_power'] = 21
                    ret = db.insert("Device_Config_Radio", dev_2g_radio_cfg)
                    if ret is False:
                        closeDB(db)
                        return ret
                dev_5g_radio_cfg = {}
                if device_type['cap_5g_chain'] != 0:
                    dev_5g_radio_cfg['radio_type'] = "5g"
                    dev_5g_radio_cfg['dev_id'] = dev_basic_cfg['id']
                    dev_5g_radio_cfg['radio_enable'] = 1
                    support_5g_ap = (int(device_type['cap_5g_service_mode']) >> 0) & 1
                    if support_5g_ap:
                        dev_5g_radio_cfg['service_mode'] = "AP"
                    else:
                        dev_5g_radio_cfg['service_mode'] = "Station"
                    dev_5g_radio_cfg['80211_mode'] = "802.11n"
                    dev_5g_radio_cfg['channel'] = 0
                    dev_5g_radio_cfg['bandwith'] = 40
                    dev_5g_radio_cfg['tx_power'] = 21
                    ret = db.insert("Device_Config_Radio", dev_5g_radio_cfg)
                    if ret is False:
                        closeDB(db)
                        return ret
            closeDB(db)
            return True
        else:
            log.logger.error("add device error! because of device type unknown!")
            closeDB(db)
            return False
    else:
        log.logger.error("db is none!")
        return False


@app.task
def set_device_basic_cfg_task(cur_dev_id, cfg):
    db = connectDB()
    if db is not None:
        ret = False
        dev_basic_cfg = db.query_one("Device_Config_Basic", {'id': cur_dev_id})
        if dev_basic_cfg:
            ret = db.update("Device_Config_Basic", {'dev_name': cfg['dev_name']}, {'id': cur_dev_id})
        if ret is True:
            notify_cfg_changed("cfg_change")
        else:
            ret="exsit"
        closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return False


@app.task
def set_device_radio_cfg_task(cur_dev_name, cfg, support_2g, support_5g):
    db = connectDB()
    if db is not None:
        dev_basic_cfg = db.query_one("Device_Config_Basic", {'dev_name': cur_dev_name})
        if dev_basic_cfg:
            dev_id = dev_basic_cfg['id']
            dev_radio_cfgs = db.query("Device_Config_Radio", {'dev_id': dev_id})
            if dev_radio_cfgs:
                for dev_radio_cfg in dev_radio_cfgs:
                    if dev_radio_cfg['radio_type'] == "2.4g":
                        del dev_radio_cfg['dev_id']
                        del dev_radio_cfg['id']
                        dev_radio_cfg['80211_mode'] = cfg['radio_2g_mode']
                        dev_radio_cfg['service_mode'] = cfg['radio_2g_role']
                        dev_radio_cfg['channel'] = cfg['radio_2g_channel']
                        dev_radio_cfg['bandwith'] = cfg['band_2g']
                        dev_radio_cfg['tx_power'] = cfg['tx_2g_pwr']
                        dev_radio_cfg['minimal_trans_rate'] = 0
                        dev_radio_cfg['station_id'] = 0
                        ret = db.update("Device_Config_Radio", dev_radio_cfg, {'dev_id': dev_id, 'radio_type': "2.4g"})
                        if ret is False:
                            return ret
                    elif dev_radio_cfg['radio_type'] == "5g":
                        del dev_radio_cfg['dev_id']
                        del dev_radio_cfg['id']
                        dev_radio_cfg['80211_mode'] = cfg['radio_5g_mode']
                        dev_radio_cfg['service_mode'] = cfg['radio_5g_role']
                        dev_radio_cfg['channel'] = cfg['radio_5g_channel']
                        dev_radio_cfg['bandwith'] = cfg['band_5g']
                        dev_radio_cfg['tx_power'] = cfg['tx_5g_pwr']
                        dev_radio_cfg['minimal_trans_rate'] = 0
                        dev_radio_cfg['station_id'] = 0
                        ret = db.update("Device_Config_Radio", dev_radio_cfg, {'dev_id': dev_id, 'radio_type': "5g"})
                        if ret is False:
                            return ret
            else:
                if support_2g == '1':
                    dev_2g_radio_cfg = {}
                    dev_2g_radio_cfg['dev_id'] = dev_id
                    dev_2g_radio_cfg['radio_type'] = "2.4g"
                    dev_2g_radio_cfg['radio_enable'] = 1
                    dev_2g_radio_cfg['80211_mode'] = cfg['radio_2g_mode']
                    dev_2g_radio_cfg['service_mode'] = cfg['radio_2g_role']
                    dev_2g_radio_cfg['channel'] = cfg['2g_radio_channel']
                    dev_2g_radio_cfg['bandwith'] = cfg['band_2g']
                    dev_2g_radio_cfg['tx_power'] = cfg['tx_2g_pwr']
                    ret = db.insert("Device_Config_Radio", dev_2g_radio_cfg)
                    if ret is False:
                        return ret
                if support_5g == '1':
                    dev_5g_radio_cfg = {}
                    dev_5g_radio_cfg['dev_id'] = dev_id
                    dev_5g_radio_cfg['radio_type'] = "5g"
                    dev_5g_radio_cfg['radio_enable'] = 1
                    dev_5g_radio_cfg['80211_mode'] = cfg['radio_5g_mode']
                    dev_5g_radio_cfg['service_mode'] = cfg['radio_5g_role']
                    dev_5g_radio_cfg['channel'] = cfg['5g_radio_channel']
                    dev_5g_radio_cfg['bandwith'] = cfg['band_5g']
                    dev_5g_radio_cfg['tx_power'] = cfg['tx_5g_pwr']
                    ret = db.insert("Device_Config_Radio", dev_5g_radio_cfg)
                    if ret is False:
                        return ret
            closeDB(db)
            notify_cfg_changed("cfg_change")
            return True
    else:
        log.logger.error("db is none!")
        return False


@app.task
def set_device_radio2ssid_cfg_task(network, ssid_on, radio, cfg):
    db = connectDB()
    if db is not None:
        ret = False
        network_cfg = db.query_one("System_Config_Network", {'network_name': network})
        if network_cfg:
            network_id = network_cfg['id']
            radio_cfg = db.query_one("Device_Config_Radio", {"dev_id": cfg['dev_id'], "radio_type": radio})
            if radio_cfg:
                radio_id = radio_cfg['id']
                dev_id = cfg['dev_id']
                key = {"dev_id": dev_id, "radio_id": radio_id, "ssid_template_id": cfg['ssid_template_id']}
                if ssid_on == "0":  # del
                    ret = db.delete("Device_Config_RadioToSsidMapping", key)
                    if ret is False:
                        return "del_ssid_fail"
                elif ssid_on == "1":  # add
                    cfg['network_id'] = network_id
                    cfg['radio_id'] = radio_id
                    security = db.query_one("Device_Config_Security", {'ssid_template_id': cfg['ssid_template_id']})
                    if security:
                        if("portal" == security['security_type']):
                            mappings =  db.query("Device_Config_RadioToSsidMapping", {'network_id': network_id,'dev_id':dev_id}) 
                            portal_num = 0
                            if mappings:   
                                for map in mappings:
                                    if map['ssid_template_id']:
                                        sec = db.query_one("Device_Config_Security", {'ssid_template_id': map['ssid_template_id']})
                                        if("portal" == sec['security_type']):
                                            portal_num+=1 
                            if portal_num == 4:
                                return "add_ssid_portal_fail"
                    max_ssid_num = 0
                    radio_type = radio_cfg['radio_type']
                    dev_type = db.query_one("Device_Config_Basic", {"id": dev_id}, fields=["dev_type_id"])
                    dev_type_id = dev_type["dev_type_id"]
                    dev_type_define = db.query_one("Device_Type_Define", {"id": dev_type_id},
                                                   fields=["cap_2g_chain", "cap_2g_ssid_num",
                                                           "cap_5g_chain", "cap_5g_ssid_num"])
                    if dev_type_define:
                        support_2g = dev_type_define['cap_2g_chain']
                        max_2g_ssid = int(dev_type_define['cap_2g_ssid_num'])
                        support_5g = dev_type_define['cap_5g_chain']
                        max_5g_ssid = int(dev_type_define['cap_5g_ssid_num'])
                        start = 1
                        end = 1
                        if radio_type == "2.4g":
                            if support_2g != 0:
                                start = 1
                                end = max_2g_ssid
                            else:
                                log.logger.error("not support 2g radio type!")
                                return "add_ssid_fail"
                        elif radio_type == "5g":
                            if support_2g != 0 and support_5g != 0:  # both 2g nad 5g
                                start = max_2g_ssid + 1
                                end = max_2g_ssid + max_5g_ssid
                            elif support_2g == 0 and support_5g != 0:  # only 5g
                                start = 1
                                end = max_5g_ssid
                            else:
                                log.logger.error("not support 5g radio type!")
                                return "add_ssid_fail"
                        else:
                            log.logger.error("unknown radio type!")
                            return "add_ssid_fail"

                        ssid_index = 0
                        for index in range(start, end):
                            radio2ssid_cfg = db.query_one("Device_Config_RadioToSsidMapping",
                                                          {"dev_id": dev_id, "ssid_index": index})
                            # find one ssid not used by any ssid template
                            if not radio2ssid_cfg:
                                ssid_index = index
                                break

                        if ssid_index:
                            cfg['ssid_index'] = ssid_index
                            ret = db.insert("Device_Config_RadioToSsidMapping", cfg)
                            if ret is False:
                                return "add_ssid_fail"
                        else:
                            log.logger.error("exceed max ssid number! can't add ssid anymore")
                            if radio_type == "2.4g":
                                return "exceed_max_2g_ssid"
                            else:
                                return "exceed_max_5g_ssid"
                    else:
                        log.logger.error("device type is null")
                        return "add_ssid_fail"

                if ret is True:
                    notify_cfg_changed("cfg_change")
        else:
            log.logger.error("network cfg is null!")
            return "add_ssid_fail"
        closeDB(db)
        return "ok"
    else:
        log.logger.error("db is none!")
        return "add_ssid_fail"


@app.task
def config_device_ssid_batch_task(action, devices, network, cfg):
    db = connectDB()
    ret = False
    if db is not None:
        network_cfg = db.query_one("System_Config_Network", {'network_name': network})
        if network_cfg:
            network_id = network_cfg['id']
            if action == 1:  # add SSIDs
                if cfg["radio_type"] == 5:
                    radio_type = "5g"
                else:
                    radio_type = "2.4g"
                del cfg['radio_type']
                dev_ids=[]
                if devices == "all":
                    dev_ids_lists = db.query("Device_Config_Basic", {"network_id": network_id}, fields=["id"])
                    for dev_ids_list in dev_ids_lists:
                        dev_ids.append(dev_ids_list['id'])
                else:
                    dev_ids = devices.split(",")
                    dev_ids.pop()
                if len(dev_ids):
                    for dev_id in dev_ids:
                        radio_cfg = db.query_one("Device_Config_Radio", {"dev_id": dev_id, "radio_type": radio_type})
                        if radio_cfg:
                            cfg["network_id"] = network_id
                            cfg["radio_id"] = radio_cfg['id']
                            dev_type = db.query_one("Device_Config_Basic", {"id": dev_id}, fields=["dev_type_id"])
                            dev_type_id = dev_type["dev_type_id"]
                            dev_type_define = db.query_one("Device_Type_Define", {"id": dev_type_id},
                                                           fields=["cap_2g_chain", "cap_2g_ssid_num",
                                                                   "cap_5g_chain", "cap_5g_ssid_num"])
                            if dev_type_define:
                                support_2g = dev_type_define['cap_2g_chain']
                                max_2g_ssid = int(dev_type_define['cap_2g_ssid_num'])
                                support_5g = dev_type_define['cap_5g_chain']
                                max_5g_ssid = int(dev_type_define['cap_5g_ssid_num'])
                                start = 1
                                end = 1
                                if radio_type == "2.4g":
                                    if support_2g != 0:
                                        start = 1
                                        end = max_2g_ssid
                                    else:
                                        log.logger.info("device[{0}] not support 2g radio type!".format(dev_id))
                                elif radio_type == "5g":
                                    if support_2g != 0 and support_5g != 0:  # both 2g nad 5g
                                        start = max_2g_ssid + 1
                                        end = max_2g_ssid + max_5g_ssid
                                    elif support_2g == 0 and support_5g != 0:  # only 5g
                                        start = 1
                                        end = max_5g_ssid
                                    else:
                                        log.logger.info("device[{0}] not support 5g radio type!".format(dev_id))
                                        closeDB(db)
                                        return "add_ssid_fail"
                                else:
                                    log.logger.error("unknown radio type!")
                                ssid_index = 0
                                for index in range(start, end):
                                    radio2ssid_cfg = db.query_one("Device_Config_RadioToSsidMapping",
                                                                  {"dev_id": dev_id, "ssid_index": index})
                                    # find one ssid not used by any ssid template
                                    if not radio2ssid_cfg:
                                        ssid_index = index
                                        break
                                if ssid_index:
                                    cfg['ssid_index'] = ssid_index
                                    cfg['dev_id'] = dev_id
                                    ssid_exist = db.query("Device_Config_RadioToSsidMapping",
                                                          {"dev_id": dev_id, "radio_id": cfg["radio_id"],
                                                           "ssid_template_id": cfg["ssid_template_id"]})
                                    if not ssid_exist:
                                        ret = db.insert("Device_Config_RadioToSsidMapping", cfg)
                                        if ret is False:
                                            log.logger.error("device[{0}] add ssid to db fail".format(dev_id))
                                else:
                                    if radio_type == "2.4g":
                                        log.logger.warning("device[{0}] exceed max 2.4g ssid number".format(dev_id))
                                    else:
                                        log.logger.warning("device[{0}] exceed max 5g ssid number".format(dev_id))
                            else:
                                log.logger.error("device type is null")
                else:
                    log.logger.error("no device need to be add ssid")
                    closeDB(db)
                    return "no_device_add"
            else:  # del SSIDs
                if devices == "all":
                    ret = db.delete("Device_Config_RadioToSsidMapping", {"ssid_template_id": cfg['ssid_template_id']})
                    if ret is False:
                        log.logger.error("delete all devices ssid fail!")
                        closeDB(db)
                        return "del_all_fail"
                else:
                    dev_ids = devices.split(",")
                    if len(dev_ids):
                        for dev_id in dev_ids:
                            if dev_id != "":
                                ret = db.delete("Device_Config_RadioToSsidMapping",
                                                {"dev_id": dev_id, "network_id": network_id,
                                                 "ssid_template_id": cfg['ssid_template_id']})
                                if ret is False:
                                    log.logger.error("delete device[{0}] ssid fail!".format(dev_id))
                    else:
                        log.logger.error("no device need to be del ssid")
                        closeDB(db)
                        return "no_device_del"
            notify_cfg_changed("cfg_change")
        else:
            log.logger.error("network cfg is null!")
            closeDB(db)
            return "network_null"
        return "ok"
    else:
        log.logger.error("db is none!")
        return "db_null"


@app.task
def set_device_ip_cfg_task(cfg):
    db = connectDB()
    if db is not None:
        ret = False
        dev_ip_cfg = db.query_one("Device_Config_Wanport", {'dev_id': cfg['dev_id']})
        if dev_ip_cfg:
            ret = db.update("Device_Config_Wanport", cfg, {'dev_id': cfg['dev_id']})
        else:
            ret = db.insert("Device_Config_Wanport", cfg)
        if ret is True:
            notify_cfg_changed("cfg_change")
        closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return False


@app.task
def set_device_upgrade_cfg_task(up_cfg):
    db = connectDB()
    if db is not None:
        ret = False
        dev_upgrade_cfg = db.query_one("Device_Config_Basic", {'id': up_cfg['id']})
        if dev_upgrade_cfg:
            ret = db.update("Device_Config_Basic", up_cfg, {'id': up_cfg['id']})
        else:
            ret = db.insert("Device_Config_Basic", up_cfg)
        if ret and up_cfg['auto_upgrade'] == "0":
            notify_cfg_changed("opt_upgrade", dev_upgrade_cfg['id'])
        closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return False


@app.task
def set_device_mgmt_cfg_task(cfg):
    db = connectDB()
    if db is not None:
        ret = False
        dev_mgt_cfg = db.query_one("Device_Config_Management", {'dev_id': cfg['dev_id']})
        if dev_mgt_cfg:
            ret = db.update("Device_Config_Management", cfg, {'dev_id': cfg['dev_id']})
        else:
            ret = db.insert("Device_Config_Management", cfg)
        if ret is True:
            notify_cfg_changed("cfg_change")
        closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return False


@app.task
def operate_device_task(action, device):
    db = connectDB()
    key = {"dev_name": device}
    ret = True
    if db is not None:
        if action == "reboot":
            log.logger.info("reboot device[{0}]".format(device))
            dev_cfg = db.query_one("Device_Config_Basic", key)
            if dev_cfg:
                dev_id = dev_cfg['id']
                notify_cfg_changed("opt_reboot", dev_id)
            else:
                log.logger.info("reboot device[{0}] fail!".format(device))
        elif action == "delete":
            dev_cfg = db.query_one("Device_Config_Basic", key)
            if dev_cfg:
                dev_id = dev_cfg['id']
                ret = db.delete("Device_Config_Basic", {'id': dev_id})
                if ret is True:
                    log.logger.info("delete device[{0}] successful!".format(device))
                    notify_cfg_changed("opt_del", dev_id)
                else:
                    log.logger.info("delete device[{0}] fail!".format(device))
            else:
                log.logger.info("delete device[{0}] fail!".format(device))
        closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return False


@app.task
def del_device_batch_task(action, devices, network):
    db = connectDB()
    ret = False
    if db is not None:
        if int(action) == 0:  # delete selected devices
            dev_ids = devices.split(",")
            for dev_id in dev_ids:
                ret = db.delete("Device_Config_Basic", {"id": dev_id})
        elif int(action) == 1:  # delete all in one network
            fields = ['id']
            network_cfg = db.query_one("System_Config_Network", {'network_name': network}, fields=fields)
            if network_cfg:
                ret = db.delete("Device_Config_Basic", {"network_id": network_cfg['id']})
            return ret
        closeDB(db)
    else:
        log.logger.error("db is none!")
        return False


@app.task
def remove_device_map_info_task(dev_id):
    db = connectDB()
    if db is not None:
        ret = False
        dev_map = db.query_one("Device_Config_Map", {'dev_id': dev_id})
        if dev_map:
            ret = db.delete("Device_Config_Map",  {'dev_id': dev_id})
        closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return False


@app.task
def set_device_map_task(cfg):
    db = connectDB()
    if db is not None:
        ret = False
        dev_map = db.query_one("Device_Config_Map", {'dev_id':cfg['dev_id']})
        if dev_map:        	
            ret = db.update("Device_Config_Map", cfg, {'dev_id':cfg['dev_id']})
        else:
            ret = db.insert("Device_Config_Map", cfg)
        closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return False 
