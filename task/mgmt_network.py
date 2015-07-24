__author__ = 'wangtao'


import task.util
from task.util import *

"""
network get/set/add function
"""

@app.task
def get_domain_map_task(domain_name):
    db = connectDB()
    ret = []
    if db is not None:
        domain = db.query_one("System_Config_Domain", {"domain_name":domain_name})
        if domain:
            domain_id = domain['id']
            networks = db.query("System_Config_Network", {"domain_id":domain_id})
            if networks:
                for u in networks:
                    network_id = u['id']
                    nmap = db.query_one("System_Network_Map",{"network_id":network_id})
                    if nmap:
                        ret.append({"network_id":network_id,"network_name":u['network_name'],
                        "longitude":nmap['longitude'],"latitude":nmap['latitude'],"zoomlevel":nmap['zoomlevel']})
        closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_network_list_task():
    db = connectDB()
    if db is not None:
        nwlists = db.query_all("System_Config_Network")
        log.logger.debug("nwlists {0}".format(nwlists))
        closeDB(db)
        return nwlists
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_network_list_search_task(cfg):
    db = connectDB()
    search_info = cfg['search_info']
    if db is not None:
        nwlists = db.query("System_Config_Network",{},search_info_item="network_name", search_info=search_info)
        log.logger.debug("nwlists {0}".format(nwlists))
        closeDB(db)
        return nwlists
    else:
        log.logger.error("db is none!")
        return None


# get device type on all network
@app.task
def get_capability_devtype_task():
    db = connectDB()
    if db is not None:
        devtype = db.query_all("Device_Type_Define")
        closeDB(db)
        return devtype
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_firmware_list_task(domain_id):
    db = connectDB()
    if db is not None:
        fwlists = db.query("Device_Firmware_FileMgmt", {"domain_id": domain_id})
        log.logger.debug("fwlists0 {0}".format(fwlists))
        if fwlists:
            for i in fwlists:
                tmp = i['upload_time']
                upload_time = str(tmp)
                i.update({'upload_time': upload_time})
            closeDB(db)
            return fwlists
        else:
            return None
    else:
        log.logger.error("db is none!")
        return None


@app.task
def add_firmware_task(cfg, path, file_name):
    ret = False
    full_path = os.path.join(path, file_name)
    log.logger.info("start check image file '{0}' ...".format(full_path))
    ret = check_image_file(full_path)
    if ret is False:
        log.logger.debug("image file is invalid!")
        if os.path.isfile(full_path):
            os.remove(full_path)
        return "file_invalid"
    ret = check_image_version(full_path, cfg['fimware_ver'])
    if ret is False:
        log.logger.debug("image version is unmatched!")
        if os.path.isfile(full_path):
            os.remove(full_path)
        return "version_unmatched"

    db = connectDB()
    if db is not None:
        domain_id = cfg['domain_id']
        domain_cfg = db.query_one("System_Config_Domain", {"id": domain_id})
        if domain_cfg:
            timezone = domain_cfg['timezone']
            sys_time = get_sys_time(timezone)
            cfg['upload_time'] = sys_time
        up_method = db.query_one("System_Config_UpgradeMethod", {"domain_id": domain_id})
        if up_method:
            up_mode = up_method['upgrade_mode']
            up_server = up_method['upgrade_server']
            remote = up_method['remote']
            sys_ip = get_sys_ip()
            if not remote and not up_server:
                up_server = sys_ip
                db.update("System_Config_UpgradeMethod", {"upgrade_server": up_server}, {"domain_id": domain_id})
            log.logger.debug("up_server: {0}".format(up_server))
            if up_mode != "http" and up_mode != "https" and sys_ip != str(up_server):
                file = os.path.join(path, file_name)
                if up_mode == "tftp":
                    cmd = "mv " + file + " ./"
                    log.logger.debug("====cmd: {0}====".format(cmd))
                    res = os.popen(cmd).read()
                    log.logger.debug("====cmd res: {0}====".format(res))
                    cmd = "tftp " + up_server + " -m binary  -c put " + file_name
                    log.logger.debug("====tftp cmd: {0}====".format(cmd))
                    res = os.popen(cmd).read()
                    log.logger.debug("====tftp cmd res: {0}====".format(res))
                    if res == "":
                        ret = True
                    else:
                        ret = False
                    cmd = "rm -rf ./" + file_name
                    log.logger.debug("====cmd: {0}====".format(cmd))
                    res = os.popen(cmd).read()
                    log.logger.debug("====cmd res: {0}====".format(res))
                elif up_mode == "ftp":
                    username = str(up_method['upgrade_user'])
                    password = str(up_method['upgrade_password'])
                    ret = ftp_put(up_server, username, password, path, file_name)
                if ret is True:
                    log.logger.info("====upload firmware file to remote server[{0}] successful!===="
                                    .format(up_server))
                    ret = db.insert("Device_Firmware_FileMgmt", cfg)
                    if ret is False:
                        return "upload_fail"
                else:
                    log.logger.error("====upload firmware file to remote server[{0}] fail!====".format(up_server))
                    return "upload_fail"
                if os.path.isfile(file):
                    os.remove(file)
            else:
                log.logger.debug("no need upload firmware to remote sever")
                ret = db.insert("Device_Firmware_FileMgmt", cfg)
                if ret is False:
                    return "upload_fail"
            if ret is True:
                dev_type_id = cfg['dev_type_id']
                file_mgts = db.query("Device_Firmware_FileMgmt", {"dev_type_id": dev_type_id},
                                     sort_by="fimware_ver")
                if file_mgts:
                    new_ver = file_mgts[0]["fimware_ver"]
                    log.logger.debug("new firmware version: {0}".format(new_ver))
                    network_cfgs = db.query("System_Config_Network", {"domain_id": domain_id})
                    for network_cfg in network_cfgs:
                        network_id = network_cfg["id"]
                        cur_plan_version = db.query_one("System_Config_DeviceUpgrade",
                                                        {"dev_type_id": cfg['dev_type_id'],
                                                         "network_id": network_id}, fields=["plan_version"])
                        if cur_plan_version and cur_plan_version["plan_version"] == 'R0.0.00.000'\
                                and str(new_ver) == str(cfg['fimware_ver']):
                            log.logger.debug("the latest version is changed to {0}".format(new_ver))
                            db.update("System_Config_Network", {"up_ok": 0}, {'id': network_id})
        else:
            log.logger.error("upgrade method is null!")
            if os.path.isfile(full_path):
                os.remove(full_path)
            return "method_error"
        closeDB(db)
        return "upload_ok"
    else:
        log.logger.error("db is none!")
        return "upload_fail"


@app.task
def delete_firmware_task(cfg):
    ret = False
    resp = None
    db = connectDB()
    if db is not None:
        idx = cfg['id']
        mgt_file = db.query_one("Device_Firmware_FileMgmt", {'id': idx})
        if mgt_file:
            networks = db.query("System_Config_Network", {'domain_id': mgt_file['domain_id']}, fields=["id"])
            for network in networks:
                db.update("System_Config_DeviceUpgrade", {"plan_version": "R0.0.00.000"},
                          {"network_id": network["id"], "dev_type_id": mgt_file['dev_type_id'],
                           "plan_version": mgt_file['fimware_ver']})
                db.update("Device_Config_Basic", {"plan_version": "null"},
                          {"network_id": network["id"], "dev_type_id": mgt_file['dev_type_id'],
                           "plan_version": mgt_file['fimware_ver']})
            file_path = FIRMWARE_FILE_PATH
            del_file = os.path.join(file_path, mgt_file['file_name'])
            log.logger.debug("=====delete file:{0}=====".format(del_file))
            if os.path.isfile(del_file):
                os.remove(del_file)
            ret = db.delete("Device_Firmware_FileMgmt", {'id': idx})
            if ret is True:
                log.logger.debug("delete firmware successful!")
                resp = "del_ok"
            else:
                log.logger.debug("delete firmware fail!")
                resp = "del_fail"
        closeDB(db)
    else:
        log.logger.error("db is none!")
        resp = "del_fail"
    return resp


@app.task
def add_network_task(cfg):
    ret = False
    netcfg = None
    dev_types = None
    up_rules = []
    db = connectDB()
    if db is not None:
        ret = db.insert("System_Config_Network", cfg)
        if ret is True:
            netcfg = db.query_one("System_Config_Network", {"network_name": cfg["network_name"]})
            if netcfg:
                dev_types = db.query_all("Device_Type_Define")
                for dev_type in dev_types:
                    up_rule = (dev_type['id'],  netcfg['id'], "R0.0.00.000")
                    up_rules.append(up_rule)
                if len(up_rules) != 0:
                    ret = db.insert_many("System_Config_DeviceUpgrade",
                                         ["dev_type_id", "network_id", "plan_version"], up_rules)
        closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return ret


@app.task
def delete_network_task(cfg):
    db = connectDB()
    if db is not None:
        dev_num = db.query_records_num("Device_Config_Basic", {"network_id": cfg["id"]})
        if int(dev_num) != 0:
            log.logger.warning("network have device, can't be delete!")
            closeDB(db)
            return "dev_exist"
        res = db.delete("System_Config_Network", cfg)
        if res is True:
            resp = "ok"
            log.logger.debug("delete network successful!")
        else:
            resp = "del_fail"
            log.logger.error("delete network fail!")
        closeDB(db)
        return resp
    else:
        log.logger.error("db is none!")
        return "db_none"


@app.task
def edit_network_task(cfg):
    db = connectDB()
    if db is not None:
        idx = cfg["id"]
        key = {'id': idx}
        res = db.update("System_Config_Network", cfg, key)
        if res is True:
            log.logger.debug("edit firmware successful!")
        else:
            log.logger.debug("edit firmware fail!")
        closeDB(db)
        return res
    else:
        log.logger.error("db is none!")
        return False


@app.task
def get_network_upgrade_rule_task():
    db = connectDB()
    if db is not None:
        fwlists = db.query_all("System_Config_DeviceUpgrade")
        log.logger.debug("network upgrade rule list {0}".format(fwlists))
        closeDB(db)
        return fwlists
    else:
        log.logger.error("db is none!")
        return None


@app.task
def config_network_upgrade_task(cfg):
    db = connectDB()
    ret = False
    if db is not None:
        nid = cfg["network_id"]
        log.logger.debug("config_network_upgrade_task network id {0}".format(nid))
        n = cfg["dev_type_id"].count("|") + 1
        type_str = cfg["dev_type_id"].split("|")
        planver_str = cfg["plan_version"].split("|")
        for i in range(0, n):
            key = {"dev_type_id": type_str[i], "network_id": int(nid)}
            upgrade_rule = db.query("System_Config_DeviceUpgrade", key)
            if upgrade_rule:
                ret = db.update("System_Config_DeviceUpgrade",
                                {"network_id": int(nid), "dev_type_id": type_str[i],
                                 "plan_version": planver_str[i]}, key)
            else:
                ret = db.insert("System_Config_DeviceUpgrade",
                                {"network_id": int(nid), "dev_type_id": type_str[i],
                                 "plan_version": planver_str[i]})
            if ret is False:
                break
        if ret is True:
            log.logger.debug("update network upgrade rule successful!")
        else:
            log.logger.error("update  network upgrade rule fail!")
        closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return False


@app.task
def delete_network_map_task(cfg):
    db = connectDB()
    if db is not None:
        res = db.delete("System_Network_Map", cfg)
        if res is True:
            devmaps = db.query_all("Device_Config_Map")
            if devmaps:
                for devmap in devmaps:
                    devid = devmap['dev_id']
                    device = db.query_one("Device_Config_Basic", {"id":devid})
                    if device:
                        if device['network_id'] == cfg['network_id'] and devmap['floor_id'] == cfg['floor_id']:
                            db.delete("Device_Config_Map", {"dev_id":devid})
            log.logger.debug("delete network map successful!")
        else:
            log.logger.debug("delete network map fail!")
        closeDB(db)
        return res
    else:
        log.logger.error("db is none!")
        return False


@app.task
def network_map_save_task(cfg):
    db = connectDB()
    ret = False
    if db is not None:
        key = {"network_id": int(cfg['network_id'])}
        network = db.query_one("System_Network_Map", key)
        if network:
            ret = db.update("System_Network_Map", {"network_id": cfg['network_id'], "map_type":0,
            	"storey_height":1, "floor_id":1, "longitude": cfg['longitude'], 
            	"latitude": cfg['latitude'], "zoomlevel":cfg['zoomlevel']}, key)
        else:
            ret = db.insert("System_Network_Map", {"network_id": cfg['network_id'], "map_type":0,
            	 "storey_height":1, "floor_id":1, "longitude": cfg['longitude'], 
            	 	"latitude": cfg['latitude'], "zoomlevel":cfg['zoomlevel']})
        if ret is True:
            devmaps = db.query_all("Device_Config_Map")
            if devmaps:
                for devmap in devmaps:
                    devid = devmap['dev_id']
                    device = db.query_one("Device_Config_Basic", {"id":devid})
                    if device:
                        if device['network_id'] == cfg['network_id']:
                            db.delete("Device_Config_Map", {"dev_id":devid})
            log.logger.debug("network map configure successful!")
        else:
            log.logger.error("network map configure fail!")
        closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return False


@app.task
def network_planemap_save_task(cfg):
    db = connectDB()
    ret = False
    if db is not None:
        key = {"network_id": int(cfg['network_id']),"longitude": cfg['longitude'], 
        	"latitude": cfg['latitude'],"floor_id":cfg['floor_id']}
        network = db.query_one("System_Network_Map", key)
        mapfile = "web/static/images/maps/" + cfg['filename']
        fd = open(mapfile,'rb')
        map_image = fd.read()
        if network:
            db.delete("System_Network_Map",key)
            ret = db.insert("System_Network_Map", {"network_id": cfg['network_id'], "map_type":1, "map_image":map_image,
            	 "longitude": cfg['longitude'], "latitude": cfg['latitude'], "zoomlevel":cfg['zoomlevel'],
            	 "address":cfg['address'],"storey_height":cfg['storey_height'],"floor_id":cfg['floor_id']})
        else:
            ret = db.insert("System_Network_Map", {"network_id": cfg['network_id'], "map_type":1, "map_image":map_image,
            	 "longitude": cfg['longitude'], "latitude": cfg['latitude'], "zoomlevel":cfg['zoomlevel'],
            	 "address":cfg['address'],"storey_height":cfg['storey_height'],"floor_id":cfg['floor_id']})
        if ret is True:
            devmaps = db.query_all("Device_Config_Map")
            if devmaps:
                for devmap in devmaps:
                    devid = devmap['dev_id']
                    device = db.query_one("Device_Config_Basic", {"id":devid})
                    if device:
                        if device['network_id'] == cfg['network_id'] and devmap['floor_id'] == cfg['floor_id']:
                            db.delete("Device_Config_Map", {"dev_id":devid})
            log.logger.debug("network plane map configure successful!")
        else:
            log.logger.error("network plane map configure fail!")
        fd.close()
        closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return False


@app.task
def get_network_map_task(nid):
    db = connectDB()
    if db is not None:
        ret = [];
        nwmaps = db.query("System_Network_Map", {"network_id":nid})
        if nwmaps:
            if 1 is nwmaps[0]['map_type']:
                for u in nwmaps:
                    print(nid)                    
                    filename = "nwmap" + str(nid) + "_" + str(u['floor_id'])  +".png"
                    mapfile = "web/static/images/maps/" + filename
                    fout = open(mapfile,'wb+')
                    fout.write(u['map_image'])
                    ret.append({'network_id':nid, 'map_type':u['map_type'], 'map_image':filename, 'address':u['address'],
                        'longitude':u['longitude'],'latitude':u['latitude'],'zoomlevel':u['zoomlevel'],
                        'storey_height':u['storey_height'],'floor_id':u['floor_id']})
                    fout.close()    
            else:
                ret.append({'network_id':nid, 'map_type':nwmaps[0]['map_type'], 'longitude':nwmaps[0]['longitude'],
                            'latitude':nwmaps[0]['latitude'],'zoomlevel':nwmaps[0]['zoomlevel']})
        closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_system_info_task(domain_id):
    system_info = []
    version_info = parse_config_file("config/version.cfg")
    system_info.append(version_info)
    db = connectDB()
    if db is not None:
        domain_cfg = db.query_one("System_Config_Domain", {"id": domain_id})
        if domain_cfg:
            timezone = domain_cfg['timezone']
            sys_time = get_sys_time(timezone)
            system_info.append({"time": sys_time})
        else:
            log.logger.error("domain_cfg is null!")
        closeDB(db)
    else:
        log.logger.error("db is none!")
    cpu_idp =get_cpu_usage()
    system_info.append({"cpu_id": cpu_idp})
    meminfo = memory_stat()
    system_info.append({"memtotal":meminfo['MemTotal']})
    system_info.append({"memused":meminfo['MemUsed']})
    disk=read_disk_info()
    if disk != '':
        disk_list=disk.split()
        system_info.append({"disktotal":disk_list[1]})
        system_info.append({"diskused":disk_list[2]})
        system_info.append({"diskutilization":disk_list[4]})
    log.logger.debug("system_info:{0}".format(system_info))
    return system_info
