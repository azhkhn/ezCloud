__author__ = 'wangtao'

from common.log import *
from common.util import *


class Message(object):
    """
    message type
    """
    APC_AC2AP_MSG_INVALID = 0
    APC_AP2AC_MSG_REG_CFG_INFO = 1
    APC_AC2AP_MSG_REG_CFG_ACK = 2
    APC_AP2AC_MSG_HB = 3
    APC_AP2AC_MSG_HB_ACK = 4

    # device cfg msg(10~99)
    APC_AC2AP_MSG_CFG_AP_RADIO = 10
    APC_AC2AP_MSG_CFG_AP_TCPIP = 11
    APC_AC2AP_MSG_CFG_AP_MGT = 12
    APC_AC2AP_MSG_CFG_AP_BASIC = 14
    APC_AC2AP_MSG_CFG_AP_DEL_SSID = 15
    APC_AC2AP_MSG_CFG_AP_PM = 16

    # ssid template cfg(100~199)
    APC_AC2AP_MSG_CFG_SSID_TEMPLATE = 100
    APC_AC2AP_MSG_CFG_SSID_BASIC = 101
    APC_AC2AP_MSG_CFG_SSID_SEC = 102
    APC_AC2AP_MSG_CFG_SSID_RADIUS = 103
    APC_AC2AP_MSG_CFG_SSID_PORTAL = 104
    APC_AC2AP_MSG_CFG_SSID_WG = 105
    APC_AC2AP_MSG_CFG_SSID_FILTER = 106
    APC_AC2AP_MSG_CFG_SSID_VLAN = 107

    # report info(300~)
    APC_AC2AP_MSG_RPT_TCPIP = 300

    # operation(500~599)
    APC_AC2AP_MSG_OPT_INVALID = 500
    APC_AC2AP_MSG_OPT_REBOOT = 501
    APC_AC2AP_MSG_OPT_DEL_AP = 502
    APC_AC2AP_MSG_OPT_UPGRADE_AP = 503
    APC_AC2AP_MSG_OPT_RESTORE = 504
    APC_AC2AP_MSG_OPT_RECOVERY = 505

    # operation ack(600~699)
    APC_AP2AC_MSG_OPT_UPGRADE_ACK = 600

    # system error msg(700~)
    APC_AC2AP_MSG_SYS_ERROR = 700
    # unknown message type msg
    APC_AC2AP_MSG_UNKNOWN = 701

    # sync all configuration(800~)
    APC_AC2AP_MSG_READY_FOR_SYNC_CFG = 800
    APC_AC2AP_MSG_READY_FOR_SYNC_CFG_ACK = 801

    # upgrade return code(1000~1099)
    APC_AP2AC_UPGRADE_SUCCESS_REBOOTING = 1000
    APC_AP2AC_UPGRADE_FAIL_BOOT_IMAGEA_SAVE = 1001
    APC_AP2AC_UPGRADE_FAIL_BOOT_VER_CHECK = 1002
    APC_AP2AC_UPGRADE_FAIL_CHECK_CRC = 1003
    APC_AP2AC_UPGRADE_FAIL_WRITE_FILE_MD0 = 1004
    APC_AP2AC_UPGRADE_FAIL_WRITE_FILE_MD4 = 1005
    APC_AP2AC_UPGRADE_FAIL_TIMEOUT = 1006
    APC_AP2AC_UPGRADE_FAIL_WRITE_FILE = 1007
    APC_AP2AC_UPGRADE_FAIL_HW_INFO = 1008,
    APC_AP2AC_UPGRADE_FAIL_OTHER = 1009,

    # register fail reason code(1100~)
    APC_AP2AC_REG_FAIL_INVALID_SN = 1100
    APC_AP2AC_REG_FAIL_INVALID_HW = 1101
    APC_AP2AC_REG_FAIL_INVALID_MAC = 1101

    # system reason code(1200~)
    APC_AC2AP_SYS_OTHER_REASON = 1200
    APC_AC2AP_SYS_DB_ERROR = 1201
    APC_AC2AP_SYS_DEV_STATE_INVALID = 1202

    # message version
    AC_AP_MSG_VERSION = '0.1'

    """
    method
    """
    def __init__(self, database):
        self.db = database

    """
    generate message header
    """
    def add_msg_header(self, dev_id, msg, msg_type):
        msg['msg_type'] = msg_type
        msg['msg_ver'] = self.AC_AP_MSG_VERSION
        if dev_id is None:
            return True
        status = self.db.query_one("Device_Status_Basic", {"dev_id": dev_id})
        if status:
            msg['data_sync'] = status['dev_data_sync']
            msg['dev_ver'] = status['dev_sw_ver_cur']
        else:
            log.logger.error("device isn't exist,add 'dev_ver' and 'data_sync' to msg fail!")
            return False

        return True

    """
    generate message body
    """
    # operate message
    def opt_msg_gen(self, dev_id, operate, op_param=None):
        msg = {}
        if operate == "reboot":
            return self.dev_reboot_msg_gen()
        elif operate == "upgrade_auto":
            return self.dev_upgrade_msg_gen(dev_id, "auto")
        elif operate == "upgrade_manual":
            return self.dev_upgrade_msg_gen(dev_id, "manual")
        elif operate == "del_dev":
            return self.dev_del_dev_msg_gen()
        else:
            log.logger.error("Unknown operation, generate message fail!")

    # cfg message
    def cfg_msg_gen(self, dev_id, cfg_info):
        cfg_block = cfg_info['op_type']
        cfg_id = cfg_info['op_param']
        if cfg_block == "Device_Config_Basic":
            if "op_act" in cfg_info.keys() and cfg_info['op_act'] == "m_update":
                return self.dev_monitor_msg_gen(dev_id, cfg_id)
            else:
                return self.dev_basic_msg_gen(dev_id, cfg_id)
        elif cfg_block == "Device_Config_Radio":
            return self.dev_radio_msg_gen(dev_id, cfg_id)
        elif cfg_block == "Device_Config_Wanport":
            return self.dev_tcpip_msg_gen(dev_id, cfg_id)
        elif cfg_block == "Device_Config_RadioToSsidMapping":
            return self.dev_ssid_msg_gen(dev_id, cfg_id, cfg_info['op_param1'], cfg_info['op_act'])
        elif cfg_block == "Device_Config_Management":
            return self.dev_mgmt_msg_gen(dev_id, cfg_id)
        elif cfg_block == "Device_Config_SsidTemplate":
            return self.dev_ssid_basic_msg_gen(dev_id, cfg_id)
        elif cfg_block == "Device_Config_Security":
            return self.dev_ssid_security_msg_gen(dev_id, cfg_id)
        elif cfg_block == "Device_Config_Radius":
            return self.dev_ssid_radius_msg_gen(dev_id, cfg_id)
        elif cfg_block == "Device_Config_Portal":
            return self.dev_ssid_portal_msg_gen(dev_id, cfg_id)
        elif cfg_block == "Device_Config_GroupId":
            return self.dev_ssid_groupid_msg_gen(dev_id, cfg_id)
        elif cfg_block == "Device_Config_WallGarden":
            return self.dev_ssid_wallgarden_msg_gen(dev_id, cfg_id)
        else:
            log.logger.error("Unknown cfg block, generate message fail!")

    def dev_basic_msg_gen(self, dev_id, cfg_id):
        cfg = self.db.query_one("Device_Config_Basic", {"id": cfg_id})
        msg = {}
        if cfg:
                msg['country_code'] = cfg['country_code']
                msg['timezone'] = cfg['timezone']
        else:
            log.logger.error("dev basic cfg isn't exist,generate msg fail!")
            return None
        ret = self.add_msg_header(dev_id, msg, self.APC_AC2AP_MSG_CFG_AP_BASIC)
        if ret is True:
            return msg
        else:
            return None

    def dev_monitor_msg_gen(self, dev_id, cfg_id):
        cfg = self.db.query_one("Device_Config_Basic", {"id": cfg_id})
        msg = {}
        if cfg:
            if cfg['monitored'] == 1:
                msg['pm_switch'] = 1
                msg['sta_list_switch'] = 1
            else:
                msg['pm_switch'] = 0
                msg['sta_list_switch'] = 0
        else:
            log.logger.error("dev monitor cfg isn't exist,generate msg fail!")
            return None
        ret = self.add_msg_header(dev_id, msg, self.APC_AC2AP_MSG_CFG_AP_PM)
        if ret is True:
            return msg
        else:
            return None

    def dev_radio_msg_gen(self, dev_id, cfg_id):
        cfg = self.db.query_one("Device_Config_Radio", {"id": cfg_id})
        msg = {}
        if cfg:
            del cfg['id']
            del cfg['dev_id']
            del cfg['radio_description']
            msg = cfg
        else:
            log.logger.error("dev radio cfg isn't exist,generate msg fail!")
            return None
        ret = self.add_msg_header(dev_id, msg, self.APC_AC2AP_MSG_CFG_AP_RADIO)
        if ret is True:
            return msg
        else:
            return None

    def dev_ssid_basic_msg_gen(self, dev_id, cfg_id):
        msg = {}
        cfg = self.db.query_one("Device_Config_RadioToSsidMapping", {"ssid_template_id": cfg_id})
        if cfg:
            radio_cfg = self.db.query_one("Device_Config_Radio", {"id": cfg['radio_id']})
            if radio_cfg:
                msg['radio_type'] = radio_cfg['radio_type']
                msg['ssid_index'] = cfg['ssid_index']
                msg['ssid_vlan_id'] = cfg['ssid_vlan_id']
                tp_id = {'ssid_template_id': cfg['ssid_template_id']}
                msg_type = self.APC_AC2AP_MSG_CFG_SSID_BASIC
                tp_cfg = self.db.query_one("Device_Config_SsidTemplate", {'id': cfg['ssid_template_id']})
                del tp_cfg['id']
                del tp_cfg['network_id']
                msg.update(tp_cfg)
            else:
                log.logger.error("dev radio cfg isn't exist,generate msg fail!")
        else:
            log.logger.error("dev ssid basic cfg isn't exist,generate msg fail!")
            return None
        ret = self.add_msg_header(dev_id, msg, msg_type)
        if ret is True:
            return msg
        else:
            return None

    def dev_ssid_security_msg_gen(self, dev_id, cfg_id):
        msg = {}
        cfg = self.db.query_one("Device_Config_RadioToSsidMapping", {"ssid_template_id": cfg_id})
        if cfg:
            radio_cfg = self.db.query_one("Device_Config_Radio", {"id": cfg['radio_id']})
            if radio_cfg:
                msg['radio_type'] = radio_cfg['radio_type']
                msg['ssid_index'] = cfg['ssid_index']
                tp_id = {'ssid_template_id': cfg['ssid_template_id']}
                msg_type = self.APC_AC2AP_MSG_CFG_SSID_SEC
                sec = self.db.query("Device_Config_Security", tp_id)
                if sec:
                    security = {}
                    security_type = sec[0]['security_type']
                    if security_type == "open":
                        security = {'security_type':0}
                    elif security_type == "wep":
                        security = {'security_type':1,'wep_key_len':sec[0]['wep_key_len'],'wep_key_type':sec[0]['wep_key_type'],'wep_key_index':sec[0]['wep_key_index'],'wep_key':sec[0]['wep_key']}
                    elif security_type == "wpa2-psk" or security_type == "wpawpa2-psk":
                        if security_type == "wpa2-psk":
                            security = {'security_type':2,'wpa_encry_type':sec[0]['wpa_encry_type'],'wpa_psk':sec[0]['wpa_psk']}
                        else:
                            security = {'security_type':3,'wpa_encry_type':sec[0]['wpa_encry_type'],'wpa_psk':sec[0]['wpa_psk']}
                    elif security_type == "wpawpa2_eap" or security_type == "wpa2_eap":
                        if security_type == "wpawpa2_eap":
                            security = {'security_type':5}
                        else:
                            security = {'security_type':4}
                    elif security_type == "portal":
                        portalcfg = self.db.query_one("Device_Config_Portal", {"ssid_template_id": cfg_id})
                        if portalcfg:
                            portal_index = portalcfg['portal_index']
                            if portal_index > 0 and portal_index < 5:
                                security = {'security_type':6,'portal_index':int(portal_index)}                                
                            else:
                                security = {'security_type':6,'portal_index':0}
                                log.logger.error("portal_index isn't exist,generate msg fail!")  
                        else:
                            log.logger.error("dev portal cfg isn't exist,generate msg fail!")  
                    msg.update(security)
                else:    
                    log.logger.error("dev ssid security cfg isn't exist,generate msg fail!")
            else:
                log.logger.error("dev radio cfg isn't exist,generate msg fail!")                                   
        else:
            log.logger.error("dev ssid security cfg isn't exist,generate msg fail!")
            return None
        ret = self.add_msg_header(dev_id, msg, msg_type)
        if ret is True:
            return msg
        else:
            return None

    def dev_ssid_radius_msg_gen(self, dev_id, cfg_id):
        msg = {}
        cfg = self.db.query_one("Device_Config_RadioToSsidMapping", {"ssid_template_id": cfg_id})
        if cfg:
            radio_cfg = self.db.query_one("Device_Config_Radio", {"id": cfg['radio_id']})
            if radio_cfg:
                msg['radio_type'] = radio_cfg['radio_type']
                msg['ssid_index'] = cfg['ssid_index']
                tp_id = {'ssid_template_id': cfg['ssid_template_id']}
                msg_type = self.APC_AC2AP_MSG_CFG_SSID_RADIUS                
                radius_cfg = self.db.query_one("Device_Config_Radius", tp_id)
                if radius_cfg:
                    del radius_cfg['id']
                    del radius_cfg['ssid_template_id']
                    msg.update(radius_cfg)
                else:   
                   log.logger.error("dev ssid radius cfg isn't exist,generate msg fail!")                
        else:
            log.logger.error("dev ssid radius cfg isn't exist,generate msg fail!")
            return None
        ret = self.add_msg_header(dev_id, msg, msg_type)
        if ret is True:
            return msg
        else:
            return None

    def dev_ssid_portal_msg_gen(self, dev_id, cfg_id):
        msg = {}
        log.logger.debug("start dev ssid group id cfg ")                
        cfg = self.db.query_one("Device_Config_RadioToSsidMapping", {"ssid_template_id": cfg_id})
        if cfg:
            radio_cfg = self.db.query_one("Device_Config_Radio", {"id": cfg['radio_id']})
            if radio_cfg:
                msg['radio_type'] = radio_cfg['radio_type']
                msg['ssid_index'] = cfg['ssid_index']
                tp_id = {'ssid_template_id': cfg['ssid_template_id']}
                msg_type = self.APC_AC2AP_MSG_CFG_SSID_PORTAL                
                portal_cfg = self.db.query_one("Device_Config_Portal", tp_id)
                if portal_cfg:
                    del portal_cfg['id']
                    del portal_cfg['ssid_template_id']
                    msg.update(portal_cfg)
                else:   
                   log.logger.error("dev ssid portal cfg isn't exist,generate msg fail!") 
            else:
                log.logger.error("dev radio portal cfg isn't exist,generate msg fail!") 
        else:
            log.logger.error("dev ssid cfg isn't exist,generate msg fail!")
            return None
        ret = self.add_msg_header(dev_id, msg, msg_type)
        if ret is True:
            log.logger.debug("dev ssid portal id cfg ok")                
            return msg
        else:
            return None

    def dev_ssid_groupid_msg_gen(self, dev_id, cfg_id):
        msg = {}
        cfg = self.db.query_one("Device_Config_RadioToSsidMapping", {"ssid_template_id": cfg_id})
        if cfg:
            radio_cfg = self.db.query_one("Device_Config_Radio", {"id": cfg['radio_id']})
            if radio_cfg:
                msg['radio_type'] = radio_cfg['radio_type']
                msg['ssid_index'] = cfg['ssid_index']
                tp_id = {'ssid_template_id': cfg['ssid_template_id']}
                msg_type = self.APC_AC2AP_MSG_CFG_SSID_FILTER                
                group_cfgs = self.db.query("Device_Config_GroupId", tp_id)
                if group_cfgs:
                    i = 0 ;
                    for group in group_cfgs :
                        group_new = {}
                        group_new.update({'filter_id%d'%int(i):group['filter_id']})
                        group_new.update({'vlan_id%d'%int(i):group['vlan_id']})
                        group_new.update({'egress_method%d'%int(i):group['egress_method']})
                        group_new.update({'egress_rate%d'%int(i):group['egress_rate']}) 
                        msg.update(group_new)
                        i=i+1
                    msg.update({'item_num':int(i)}) 
                else:   
                   log.logger.error("dev ssid group id cfg isn't exist,generate msg fail!")                
        else:
            log.logger.error("dev ssid groupid cfg isn't exist,generate msg fail!")
            return None
        ret = self.add_msg_header(dev_id, msg, msg_type)
        if ret is True:
            return msg
        else:
            return None        

    def dev_ssid_wallgarden_msg_gen(self, dev_id, cfg_id):
        msg = {}
        cfg = self.db.query_one("Device_Config_RadioToSsidMapping", {"ssid_template_id": cfg_id})
        if cfg:
            radio_cfg = self.db.query_one("Device_Config_Radio", {"id": cfg['radio_id']})
            if radio_cfg:
                msg['radio_type'] = radio_cfg['radio_type']
                msg['ssid_index'] = cfg['ssid_index']
                tp_id = {'ssid_template_id': cfg['ssid_template_id']}
                msg_type = self.APC_AC2AP_MSG_CFG_SSID_WG                
                wallcfgs = self.db.query("Device_Config_WallGarden", tp_id)
                if wallcfgs:
                    i = 0 ;
                    for wallcfg in wallcfgs :
                        wall_new = {}
                        wall_new.update({'wallgarden_name%s'%int(i):wallcfg['wallgarden_name']})
                        wall_new.update({'url%s'%int(i):wallcfg['url']})
                        msg.update(wall_new)
                        i=i+1
                    msg.update({'garden_count':int(i)})
                    portalcfg = db.query_one("Device_Config_Portal", {"ssid_template_id": cfg_id})
                    if portalcfg:
                        portal_index = portalcfg['portal_index']
                        if portal_index > 0 and portal_index < 5:
                            msg.update({'portal_index':int(portal_index)})
                else:   
                   log.logger.error("dev ssid group id cfg isn't exist,generate msg fail!")                
        else:
            log.logger.error("dev ssid wallgarden cfg isn't exist,generate msg fail!")
            return None
        ret = self.add_msg_header(dev_id, msg, msg_type)
        if ret is True:
            return msg
        else:
            return None        

    def dev_ssid_msg_gen(self, dev_id, cfg_id, cfg_id1, act):
        msg = {}
        if act == "delete":
            msg_type = self.APC_AC2AP_MSG_CFG_AP_DEL_SSID
            radio_cfg = self.db.query_one("Device_Config_Radio", {"id": cfg_id})
            if radio_cfg:
                msg['radio_type'] = radio_cfg['radio_type']
                msg['ssid_index'] = cfg_id1
            else:
                return None
        else:
            cfg = self.db.query_one("Device_Config_RadioToSsidMapping", {"id": cfg_id})
            if cfg:
                radio_cfg = self.db.query_one("Device_Config_Radio", {"id": cfg['radio_id']})
                if radio_cfg:
                    msg['radio_type'] = radio_cfg['radio_type']
                    msg['ssid_index'] = cfg['ssid_index']
                    msg['ssid_vlan_id'] = cfg['ssid_vlan_id']
                    tp_id = {'ssid_template_id': cfg['ssid_template_id']}
                    if act == "insert":
                        msg_type = self.APC_AC2AP_MSG_CFG_SSID_TEMPLATE
                        tp_cfg = self.db.query_one("Device_Config_SsidTemplate", {'id': cfg['ssid_template_id']})
                        del tp_cfg['id']
                        del tp_cfg['network_id']
                        msg.update(tp_cfg)
                        sec = self.db.query("Device_Config_Security", tp_id)
                        if sec:
                            security_type = sec[0]['security_type']
                            if security_type == "open":
                                security = {'security_type':0}
                            elif security_type == "wep":
                                security = {'security_type':1,'wep_key_len':sec[0]['wep_key_len'],'wep_key_type':sec[0]['wep_key_type'],'wep_key_index':sec[0]['wep_key_index'],'wep_key':sec[0]['wep_key']}
                            elif security_type == "wpa2-psk" or security_type == "wpawpa2-psk":
                                if security_type == "wpa2-psk":
                                    security = {'security_type':2,'wpa_encry_type':sec[0]['wpa_encry_type'],'wpa_psk':sec[0]['wpa_psk']}
                                else:
                                    security = {'security_type':3,'wpa_encry_type':sec[0]['wpa_encry_type'],'wpa_psk':sec[0]['wpa_psk']}
                            elif security_type == "wpawpa2_eap" or security_type == "wpa2_eap":
                                if security_type == "wpawpa2_eap":
                                    security = {'security_type':5}
                                else:
                                    security = {'security_type':4}
                                radius_cfg = self.db.query_one("Device_Config_Radius", tp_id)
                                if radius_cfg:
                                    del radius_cfg['id']
                                    del radius_cfg['ssid_template_id']
                                    msg.update(radius_cfg)
                                    group_cfgs = self.db.query("Device_Config_GroupId", tp_id)
                                    if group_cfgs:
                                        i = 0 ;
                                        for group in group_cfgs :
                                            group_new = {}
                                            group_new.update({'filter_id%d'%int(i):group['filter_id']})
                                            group_new.update({'vlan_id%d'%int(i):group['vlan_id']})
                                            group_new.update({'egress_method%d'%int(i):group['egress_method']})
                                            group_new.update({'egress_rate%d'%int(i):group['egress_rate']}) 
                                            msg.update(group_new)
                                            i=i+1
                                        msg.update({'item_num':int(i)}) 
                            elif security_type == "portal":
                                security = {'security_type':6}
                                portal_cfg = self.db.query_one("Device_Config_Portal", tp_id)
                                if portal_cfg:
                                    del portal_cfg['id']
                                    del portal_cfg['ssid_template_id']
                                    msg.update(portal_cfg)
                                    group_cfgs = self.db.query("Device_Config_GroupId", tp_id)
                                    if group_cfgs:
                                        i = 0 ;
                                        for group in group_cfgs :
                                            group_new = {}
                                            group_new.update({'filter_id%d'%int(i):group['filter_id']})
                                            group_new.update({'vlan_id%d'%int(i):group['vlan_id']})
                                            group_new.update({'egress_method%d'%int(i):group['egress_method']})
                                            group_new.update({'egress_rate%d'%int(i):group['egress_rate']}) 
                                            msg.update(group_new)
                                            i=i+1
                                        msg.update({'item_num':int(i)})                                    
                                    wallcfgs = self.db.query("Device_Config_WallGarden", tp_id)
                                    if wallcfgs:
                                        i = 0 ;
                                        for wallcfg in wallcfgs :
                                            wall_new = {}
                                            wall_new.update({'wallgarden_name%s'%int(i):wallcfg['wallgarden_name']})
                                            wall_new.update({'url%s'%int(i):wallcfg['url']})
                                            msg.update(wall_new)
                                            i=i+1
                                        msg.update({'garden_count':int(i)})
                                    
                                radius_cfg = self.db.query_one("Device_Config_Radius", tp_id)
                                if radius_cfg:
                                    del radius_cfg['id']
                                    del radius_cfg['ssid_template_id']
                                    msg.update(radius_cfg)
                        msg.update(security)
                    elif act == "update":
                        msg_type = self.APC_AC2AP_MSG_CFG_SSID_VLAN
            else:
                log.logger.error("dev ssid all cfg isn't exist,generate msg fail!")
                return None
        ret = self.add_msg_header(dev_id, msg, msg_type)
        if ret is True:
            return msg
        else:
            return None

    def dev_tcpip_msg_gen(self, dev_id, cfg_id):
        cfg = self.db.query_one("Device_Config_Wanport", {"id": cfg_id})
        msg = {}
        if cfg:
            del cfg['id']
            del cfg['dev_id']
            del cfg['wanport_feature']
            del cfg['flag']
            msg = cfg
        else:
            log.logger.error("dev tcp/ip cfg isn't exist,generate msg fail!")
            return None
        ret = self.add_msg_header(dev_id, msg, self.APC_AC2AP_MSG_CFG_AP_TCPIP)
        if ret is True:
            return msg
        else:
            return None

    def dev_mgmt_msg_gen(self, dev_id, cfg_id):
        cfg = self.db.query_one("Device_Config_Management", {"id": cfg_id})
        msg = {}
        if cfg:
            del cfg['id']
            del cfg['dev_id']

            msg = cfg
        else:
            log.logger.error("dev management cfg isn't exist,generate msg fail!")
            return None
        ret = self.add_msg_header(dev_id, msg, self.APC_AC2AP_MSG_CFG_AP_MGT)
        if ret is True:
            return msg
        else:
            return None

    # register message
    def reg_ack_msg_gen(self, result, reason, dev_id):
        msg = {}
        if result:
            msg['value'] = "1"
            dev_cfg = self.db.query_one("Device_Config_Basic", {"id": dev_id})
            if dev_cfg:
                timezone = dev_cfg['timezone']
                sys_time = get_sys_time(timezone)
                msg['ap_date'] = sys_time
        else:
            msg['value'] = "0"
        msg['return_code'] = reason
        ret = self.add_msg_header(None, msg, self.APC_AC2AP_MSG_REG_CFG_ACK)
        if ret is True:
            return msg
        else:
            return None

    # heartbeat message
    def hb_ack_msg_gen(self):
        msg = {}
        ret = self.add_msg_header(None, msg, self.APC_AP2AC_MSG_HB_ACK)
        if ret is True:
            return msg
        else:
            return None

    # system error message
    def sys_error_msg_gen(self, reason):
        msg = {}
        msg['reason'] = reason
        ret = self.add_msg_header(None, msg, self.APC_AC2AP_MSG_SYS_ERROR)
        if ret is True:
            return msg
        else:
            return None

    # unknown message type
    def unknown_msg_type_gen(self):
        msg = {}
        ret = self.add_msg_header(None, msg, self.APC_AC2AP_MSG_UNKNOWN)
        if ret is True:
            return msg
        else:
            return None

    # operate message
    def dev_reboot_msg_gen(self):
        msg = {}
        ret = self.add_msg_header(None, msg, self.APC_AC2AP_MSG_OPT_REBOOT)
        if ret is True:
            return msg
        else:
            return None

    def dev_del_dev_msg_gen(self):
        msg = {}
        ret = self.add_msg_header(None, msg, self.APC_AC2AP_MSG_OPT_DEL_AP)
        if ret is True:
            return msg
        else:
            return None

    def dev_upgrade_msg_gen(self, dev_id, up_way):
        msg = {}
        dev_basic = self.db.query_one("Device_Config_Basic", {'id': dev_id})
        if dev_basic:
            dev_type_id = dev_basic['dev_type_id']
            auto_upgrade = dev_basic['auto_upgrade']
            network_id = dev_basic['network_id']
            net_cfg = self.db.query_one("System_Config_Network", {"id": network_id})
            method = self.db.query_one("System_Config_UpgradeMethod", {'domain_id': net_cfg["domain_id"]})
            if method:
                if method['upgrade_mode'] != "ftp":
                    del method['upgrade_user']
                    del method['upgrade_password']
                del method['id']
                del method['domain_id']
                if auto_upgrade == 1:  # device auto upgrade
                    auto_upgrade = net_cfg['auto_upgrade']
                    if auto_upgrade == 1:
                        log.logger.debug(method)
                        dev_status = self.db.query_one("Device_Status_Basic", {"dev_id": dev_id})
                        if dev_status:
                            dev_version = dev_status['dev_sw_ver_cur']
                            dev_upgrade = self.db.query_one("System_Config_DeviceUpgrade",
                                                            {'network_id': network_id, 'dev_type_id': dev_type_id})
                            if dev_upgrade:
                                log.logger.debug(dev_upgrade)
                                plan_version = dev_upgrade['plan_version']
                                if str(plan_version) == "R0.0.00.000":
                                    log.logger.debug("choose the latest version to upgrade!")
                                    firmlist = self.db.query("Device_Firmware_FileMgmt",
                                                             {'dev_type_id': dev_type_id}, sort_by="fimware_ver",
                                                             is_desc="true")
                                    if firmlist:
                                            plan_version = firmlist[0]['fimware_ver']
                                log.logger.debug("auto: dev_version is %s,plan_version is %s"%(dev_version, plan_version))
                                if str(plan_version) != "R0.0.00.000" and plan_version != dev_version:
                                    dev_define = self.db.query_one("Device_Type_Define", {'id': dev_type_id})
                                    if dev_define:
                                        method['target_ver'] = str(plan_version)
                                        method['file_name'] = str(dev_define['dev_model'])+str(plan_version)
                                        ret = self.add_msg_header(None, method, self.APC_AC2AP_MSG_OPT_UPGRADE_AP)
                                        if ret is True:
                                            msg.update(method)
                    else:
                        log.logger.error("network auto upgrade is disabled!")
                else:  # device manual upgrade
                    if up_way == "manual":
                        if len(dev_basic['plan_version']) != 0 and dev_basic['plan_version'] != "null":
                            plan_version = str(dev_basic['plan_version'])
                            dev_status = self.db.query_one("Device_Status_Basic", {"dev_id": dev_id})
                            if dev_status:
                                dev_version = str(dev_status['dev_sw_ver_cur'])
                                log.logger.debug("manual: dev_version is %s,plan_version is %s"%(dev_version, plan_version))
                                if plan_version != dev_version:
                                    dev_define = self.db.query_one("Device_Type_Define", {'id': dev_type_id})
                                    if dev_define:
                                        method['target_ver'] = str(plan_version)
                                        method['file_name'] = str(dev_define['dev_model'])+str(plan_version)
                                        ret = self.add_msg_header(None, method, self.APC_AC2AP_MSG_OPT_UPGRADE_AP)
                                        if ret is True:
                                            msg.update(method)
                        else:
                            log.logger.error("plan_version is null")
            else:
                log.logger.error("upgrade method is null")

        if len(msg) != 0:
            return msg
        else:
            return None

    def ready_for_sync_cfg_msg_gen(self):
        msg = {}
        ret = self.add_msg_header(None, msg, self.APC_AC2AP_MSG_READY_FOR_SYNC_CFG)
        if ret is True:
            return msg
        else:
            return None