__author__ = 'wangtao'


import task.util
from task.util import *


"""
SSID get/set/add function
"""


@app.task
def get_ssid_list_task(params):
    start = None
    offset = None
    search_info = None
    network = None
    if params['network']:
        network = params['network']
    if params['start']:
        start = params['start']
    if params['offset']:
        offset = params['offset']
    if params['search_info']:
        search_info = params['search_info']
    db = connectDB()
    if db is not None:
        ssidlist = []
        network_cfg = db.query_one("System_Config_Network", {'network_name': network})
        if network_cfg:
            if start and offset:
                total_num = db.query_records_num("Device_Config_SsidTemplate", {"network_id": network_cfg['id']})
                record_info = {}
                record_info['data_type'] = "summary"
                if total_num:
                    record_info['total'] = total_num
                else:
                    record_info['total'] = 0
                record_info['start'] = start
                record_info['offset'] = offset
                ssidlist.append(record_info)
                ssidcfgs = db.query("Device_Config_SsidTemplate", {"network_id": network_cfg['id']}, start=start, offset=offset)
            if search_info:
                ssidcfgs = db.query("Device_Config_SsidTemplate", {"network_id": network_cfg['id']}, search_info_item="ssid_name", search_info=search_info)
            if ssidcfgs:
                for ssidcfg in ssidcfgs:
                    ssidinfo = ssidcfg
                    ssid_template_id = ssidcfg['id']
                    security = db.query("Device_Config_Security", {"ssid_template_id": int(ssid_template_id)})
                    if security:
                        ssidinfo.update(security[0])
                        # enable Ap list on this ssid
                        apInfoList = db.query("Device_Config_RadioToSsidMapping",
                                              {"ssid_template_id": int(ssid_template_id)})
                        key1 = {}
                        if apInfoList:
                            for dev in apInfoList:
                                devid = dev['dev_id']
                                key1 = {'id': devid}
                                devlist = []
                                devlist = db.query("Device_Config_Basic", key1)
                                ssidinfo.update({"ap_num": len(apInfoList)})
                        else:
                            ssidinfo.update({"ap_num": 0})
                        network_info = {}
                        network_id = ssidcfg['network_id']
                        network = db.query_one("System_Config_Network", {'id': network_id})
                        if network:
                            network_info['network_name'] = network['network_name']
                            network_info['data_type'] = "network"
                        else:
                            network_info['network_name'] = "none"
                            network_info['data_type'] = "network"
                        ssidinfo.update(network_info)
                        ssidlist.append(ssidinfo)
        if ssidlist:
            closeDB(db)
            return ssidlist
        else:
            closeDB(db)
            return None
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_ssid_summary_task(cfg):
    db = connectDB()
    if db is not None:
        network_name = cfg['network_name']
        start = cfg['start']
        offset = cfg['offset']
        ssidlist = []
        network_cfg = db.query_one("System_Config_Network", {'network_name': network_name})
        if network_cfg:
            total_num = db.query_records_num("Device_Config_SsidTemplate", {"network_id": network_cfg['id']})
            record_info = {}
            record_info['data_type'] = "summary"
            if total_num:
                record_info['total'] = total_num
            else:
                record_info['total'] = 0
            record_info['start'] = start
            record_info['offset'] = offset
            ssidlist.append(record_info)
            ssidcfgs = db.query("Device_Config_SsidTemplate", {"network_id": network_cfg['id']}, start=start, offset=offset)
            if ssidcfgs:
                for ssidcfg in ssidcfgs:
                    network_info = {}
                    network_info['network_name'] = network_name
                    ssidlist.append(ssidcfg)
            ssidlist = append_network_data(ssidlist, db)
            closeDB(db)
            return ssidlist
    else:
        log.logger.error("db is none!")
        return None


@app.task
def add_ssid_template_task(cfg):
    db = connectDB()
    if db is not None:
        ssidname = cfg['ssid_name']
        network_name = cfg['network_name']
        network = db.query_one("System_Config_Network", {'network_name': network_name})
        if network:
            network_id = network['id']
            network_num = db.query_records_num("Device_Config_SsidTemplate", {'network_id': network_id})
            if network_num:
                log.logger.debug("current ssid num is %d"%network_num)
                if network_num == 32:
                    log.logger.error("already 32 ssid template exist")
                    closeDB(db)
                    return 32           
            name = {"ssid_name": ssidname, "network_id": network_id}        
            ssid = db.query("Device_Config_SsidTemplate", name)
            if ssid:
                log.logger.debug("add ssid cfg to DB")
                closeDB(db)
                return None
            else:
                log.logger.debug("insert ssid data to DB")
                db.insert("Device_Config_SsidTemplate", name)
                template = db.query("Device_Config_SsidTemplate", name)
                log.logger.debug(template)
                ssid_template_id = template[0]['id']
                db.insert("Device_Config_Security", {"ssid_template_id": int(ssid_template_id)})
                db.insert("Device_Config_Radius", {"ssid_template_id": int(ssid_template_id)})
                db.insert("Device_Config_Portal", {"ssid_template_id": int(ssid_template_id)})
                db.insert("Device_Config_WallGarden", {"ssid_template_id": int(ssid_template_id)})
                closeDB(db)
                return "ok"
    else:
        log.logger.error("db is none!")
        return None


@app.task
def deletessid_task(cfg):
    db = connectDB()
    if db is not None:
        ssidname = cfg['ssid_name']
        network_id = cfg['network_id']
        name = {"ssid_name": ssidname, "network_id": network_id}
        ssid = db.query("Device_Config_SsidTemplate", name)
        if ssid:
            log.logger.debug("del ssid cfg in DB")
            db.delete("Device_Config_SsidTemplate", name, True)
        closeDB(db)
        return True
    else:
        log.logger.error("db is none!")
        return False


@app.task
def get_apSsidEnableInfo_task(serch):
    db = connectDB()
    if db is not None:
        key = serch
        apInfoList = db.query("Device_Config_RadioToSsidMapping", key)
        key1 = {}
        devlists = []
        for dev in apInfoList:
            devid = dev['dev_id']
            key1 = {'id': devid}
            devlist = db.query("Device_Config_Basic", key1)
            devlists.append(devlist['dev_name'])
        closeDB(db)
        return devlists
    else:
        log.logger.error("db is none!")
        return None


@app.task
def Update_filteridCfg_task(group):
    db = connectDB()
    if db is not None:
        ssid_template_id = group['ssid_template_id']
        db.insert("Device_Config_GroupId", group)
        notify_cfg_changed("cfg_change")
        closeDB(db)
        return True
    else:
        log.logger.error("db is none!")
        return False


@app.task
def Del_filteridCfg_task(garden):
    db = connectDB()
    if db is not None:
        ssid_template_id = garden['ssid_template_id']
        group = db.query_one("Device_Config_GroupId", {"ssid_template_id": int(ssid_template_id)})
        if group:
            db.delete("Device_Config_GroupId", {"ssid_template_id": int(ssid_template_id)})
            closeDB(db)
            return True
        else:
            log.logger.error("group db is not exist!")
            closeDB(db)
            return False
    else:
        log.logger.error("db is none!")
        return False


@app.task
def Update_SsidBasicCfg_task(cfg):
    log.logger.debug("cfg is {0}".format(cfg))
    db = connectDB()
    if db is not None:
        ssid_template_id = cfg['id']
        network_id = cfg['network_id']
        key = {"id": int(ssid_template_id), "network_id": network_id}
        ssid = db.query("Device_Config_SsidTemplate", key)
        if ssid:
            log.logger.debug("update ssid cfg to DB")
            db.update("Device_Config_SsidTemplate", cfg, key)
        else:
            log.logger.debug("insert ssid data to DB")
            db.insert("Device_Config_SsidTemplate", cfg)
        notify_cfg_changed("cfg_change")
        closeDB(db)
        return True
    else:
        log.logger.error("db is none!")
        return None


@app.task
def Update_ssidCfg_task(cfg):
    log.logger.debug("cfg is {0}".format(cfg))
    db = connectDB()
    if db is not None:
        ssid_template_id = cfg['id']
        network_id = cfg['network_id']
        key = {"id": int(ssid_template_id), "network_id": network_id}
        ssid = db.query("Device_Config_SsidTemplate", key)
        if ssid:
            log.logger.debug("update ssid cfg to DB")
            db.update("Device_Config_SsidTemplate", cfg, key)
        else:
            log.logger.debug("insert ssid data to DB")
            db.insert("Device_Config_SsidTemplate", cfg)
        notify_cfg_changed("cfg_change")
        closeDB(db)
    else:
        log.logger.error("db is none!")
        return None


@app.task
def Update_RadiusCfg_task(radius):
    log.logger.debug("set_RadiusCfg_task radius is {0}".format(radius))
    db = connectDB()
    if db is not None:
        ssid_template_id = radius['ssid_template_id']
        key = {"ssid_template_id": int(ssid_template_id)}
        radiuscfg = db.query("Device_Config_Radius", key)
        if radiuscfg:
            log.logger.debug("update radius cfg to DB")
            db.update("Device_Config_Radius", radius, key)
        else:
            log.logger.debug("insert radius data to DB")
            db.insert("Device_Config_Radius", radius)
        notify_cfg_changed("cfg_change")
        closeDB(db)
        return True
    else:
        log.logger.error("db is none!")
        return False


@app.task
def Update_PortalCfg_task(portal):
    db = connectDB()
    if db is not None:
        ssid_template_id = portal['ssid_template_id']
        key = {"ssid_template_id": int(ssid_template_id)}
        portalcfg = db.query("Device_Config_Portal", key)
        if portalcfg:
            db.update("Device_Config_Portal", portal, key)
        else:
            db.insert("Device_Config_Portal", portal)
        notify_cfg_changed("cfg_change")
        closeDB(db)
        return True
    else:
        log.logger.error("db is none!")
        return False


@app.task
def Update_SsidSecCfg_task(cfg):
    db = connectDB()
    if db is not None:
        ssid_template_id = cfg['ssid_template_id']
        security_type = cfg['security_type']        
        network_id = cfg['network_id']  
        del cfg['network_id']
        key = {"ssid_template_id": int(ssid_template_id)}
        seccfg = db.query("Device_Config_Security", key)
        if seccfg:             
            db.update("Device_Config_Security", cfg, key)
        else:
            db.insert("Device_Config_Security", cfg)
            
        if(security_type == "portal"):            
            ssids = db.query("Device_Config_SsidTemplate", {'network_id':network_id})
            portal_num = 0
            portal_index = 0
            index_dict = {}
            for ssid in ssids:
                if ssid:
                    ssid_id = ssid['id']
                    sec = db.query_one("Device_Config_Security", {'ssid_template_id': int(ssid_id)})
                    if sec:  
                        if sec['security_type'] == "portal":
                            portal_num +=1
                            print("current portal_num is %d"%portal_num)
                            if(portal_num == 5):
                                print("we can only support 4 portal type ssid at most")
                                db.update("Device_Config_Security", {'security_type': "open", 'ssid_template_id': int(ssid_template_id)}, key)
                                closeDB(db)
                                return 4   
                            portal = db.query_one("Device_Config_Portal", {'ssid_template_id': int(ssid_id)})
                            portal_index = portal['portal_index']
                            if portal_index != 0 and portal_num < 5:                            
                                index_dict[portal_index] = portal_index           
            for i in range (1,5):    
                if i in index_dict.keys():
                    print("not in dict")
                else:    
                    db.update("Device_Config_Portal", {'portal_index':int(i)}, {'ssid_template_id': int(ssid_template_id)})                                        
                    break
        else:
            db.update("Device_Config_Portal", {'portal_index':0}, key)   
        notify_cfg_changed("cfg_change")
        closeDB(db)
        return True
    else:
        log.logger.error("db is none!")
        return False


@app.task
def Update_WallGardenCfg_task(garden):
    db = connectDB()
    if db is not None:
        ssid_template_id = garden['ssid_template_id']
        key = {"ssid_template_id": int(ssid_template_id)}
        portalcfg = db.query("Device_Config_WallGarden", key)
        db.insert("Device_Config_WallGarden", garden)
        notify_cfg_changed("cfg_change")
        closeDB(db)
        return True
    else:
        log.logger.error("db is none!")
        return False


@app.task
def Del_WallGardenCfg_task(garden):
    db = connectDB()
    if db is not None:
        ssid_template_id = garden['ssid_template_id']
        db.delete("Device_Config_WallGarden", {"ssid_template_id": int(ssid_template_id)})
        closeDB(db)
        return True
    else:
        log.logger.error("db is none!")
        return False


@app.task
def get_network_id_task(name):
    db = connectDB()
    if db is not None:
        network_name = name['network_name']
        network = db.query_one("System_Config_Network", {'network_name': network_name})
        if network:
            network_id = network['id']
            closeDB(db)
            if network_id:
                return network_id
            else:
                return None
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_ssidtemplate_task(search):
    db = connectDB()
    if db is not None:
        ssid_name = search['ssid_name']
        network_name = search['network_name']
        network = db.query_one("System_Config_Network", {'network_name': network_name})
        if network:
            network_id = network['id']
            if network_id:
                template = []
                sssid_use_name = db.query("Device_Config_RadioToSsidMapping", {'network_id': network_id})
                if sssid_use_name:
                    for cfg in sssid_use_name:
                        ssid_name_by_devic_using = {}
                        ssid_name_by_devic_using['data_type'] = "ssid_usering_name"
                        ssid_tp_cfg = db.query_one("Device_Config_SsidTemplate",
                                                   {'id': cfg['ssid_template_id']})
                        if ssid_tp_cfg:
                            ssid_name_by_devic_using['ssid_name_by_device'] = ssid_tp_cfg['ssid_name']
                            template.append(ssid_name_by_devic_using)
                basic = db.query("Device_Config_SsidTemplate", {"ssid_name": str(ssid_name),
                                                                "network_id": int(network_id)})
                if basic:
                    template.append(basic[0])
                    basic[0].update({"block": "basic"})
                    ssid_template_id = basic[0]['id']
                    security = db.query("Device_Config_Security", {"ssid_template_id": str(ssid_template_id)})
                    if security:
                        security[0].update({"block": "security"})
                        template.append(security[0])
                    radius = db.query("Device_Config_Radius", {"ssid_template_id": str(ssid_template_id)})
                    if radius:
                        radius[0].update({"block": "radius"})
                        template.append(radius[0])
                    group = db.query("Device_Config_GroupId", {"ssid_template_id": str(ssid_template_id)})
                    if group:
                        j = 0
                        for i in group:
                            i.update({"block": "group", "group_num": j})
                            j = j + 1
                            template.append(i)
                    portal = db.query("Device_Config_Portal", {"ssid_template_id": str(ssid_template_id)})
                    if portal:
                        portal[0].update({"block": "portal"})
                        template.append(portal[0])
                    wallgarden = db.query("Device_Config_WallGarden", {"ssid_template_id": str(ssid_template_id)})
                    if wallgarden:
                        for j in wallgarden:
                            j.update({"block": "wallgarden"})
                            template.append(j)
                    # enable Ap list on this ssid
                    apInfoList = db.query("Device_Config_RadioToSsidMapping",
                                          {"ssid_template_id": int(ssid_template_id), "network_id": int(network_id)})
                    key1 = {}
                    if apInfoList:
                        for dev in apInfoList:
                            devid = dev['dev_id']
                            key1 = {'id': devid}
                            devlist = []
                            device_info = {}
                            device_type = {}
                            devlist = db.query("Device_Config_Basic", key1)
                            devlist[0].update({"block": "aplist", "dev_name": devlist[0]['dev_name'],
                                               "id": devlist[0]['id'], "ap_num": len(apInfoList)})
                            device_type = db.query_one("Device_Type_Define", {'id': devlist[0]['dev_type_id']})
                            if device_type:
                                device_info['model_name'] = device_type['model_name']
                                device_info['dev_vendor'] = device_type['dev_vendor']
                                network = db.query_one("System_Config_Network", {'id': devlist[0]['id']})
                                if network:
                                    device_info['network_name'] = network['network_name']
                                else:
                                    device_info['network_name'] = "none"
                            else:
                                device_info['model_name'] = "none"
                                device_info['dev_vendor'] = "none"
                                device_info['network_name'] = "none"
                            device_stat = db.query_one("Device_Status_Basic", {'dev_id': devlist[0]['id']})
                            if device_stat:
                                device_info['dev_state'] = device_stat['dev_state']
                            else:
                                device_info['dev_state'] = 0

                            devlist[0].update(device_info)
                            template.append(devlist[0])

                    else:
                        template.append({"block": "aplist", "ap_num": 0})
                    template.append({"block": "network", "network_name": network_name})
                    closeDB(db)
                    return template
                else:
                    closeDB(db)
                    return None
        else:
            log.logger.error("can't find network: {0}".format(network_name))
            closeDB(db)
            return None
    else:
        log.logger.error("db is none")
        return None


@app.task
def get_ssid_template_id_task(cfg):
    db = connectDB()
    if db is not None:
        ssid_name = cfg['ssid_name']
        network_id = cfg['network_id']
        basic = db.query("Device_Config_SsidTemplate", {"network_id": network_id, "ssid_name": ssid_name})
        if basic:
            ssid_template_id = basic[0]['id']
            closeDB(db)
            return ssid_template_id
        else:
            closeDB(db)
            return None
    else:
        log.logger.error("db is none")
        return None
