__author__ = 'wangtao'


import task.util
from task.util import *

"""
network get/set/add function
"""
@app.task
def get_country_code_list_task():
    db = connectDB()
    if db is not None:
        code_list = []
        country_list = db.query("Device_Country_Channel_Define", {"radio_type": '2.4g'})
        if country_list:
            for country in country_list:
                code_list.append(country["country_code"])
        closeDB(db)
        if len(code_list) != 0:
            return code_list
        else:
            return None
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_system_upgrade_method_task(domain_id):
    db = connectDB()
    if db is not None:
        sys_upmethod = db.query_one("System_Config_UpgradeMethod", {"domain_id": domain_id})
        closeDB(db)
        return sys_upmethod
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_system_basic_task(domain_id):
    db = connectDB()
    if db is not None:
        sys_basic = db.query_one("System_Config_Domain", {"id": domain_id})
        closeDB(db)
        return sys_basic
    else:
        log.logger.error("db is none!")
        return None


@app.task
def set_system_basic_task(cfg):
    db = connectDB()
    res = False
    if db is not None:
        domain_id = cfg["id"]
        sys_basic = db.query_one("System_Config_Domain", {"id": domain_id})
        del cfg["id"]
        if sys_basic is not None:
            res = db.update("System_Config_Domain", cfg, {"id": domain_id})
        else:
            res = db.insert("System_Config_Domain", cfg)
        closeDB(db)
        return res
    else:
        log.logger.error("db is none!")
        return False


@app.task
def set_system_upgrade_method_task(cfg):
    db = connectDB()
    res = False
    if db is not None:
        domain_id = cfg["domain_id"]
        sys_upmethod = db.query_one("System_Config_UpgradeMethod", {"domain_id": domain_id})
        sys_ip = get_sys_ip()
        if cfg['upgrade_mode'] == "http" or cfg['upgrade_mode'] == "https":
            cfg['upgrade_server'] = "http://" + sys_ip + ":8000/get_firmwareFile"
        else:  # ftp/tftp
            if not cfg["remote"]:  # local server
                cfg['upgrade_server'] = sys_ip
                if cfg['upgrade_mode'] == "ftp":
                    cfg['upgrade_user'] = "wms"
                    cfg['upgrade_password'] = "wms"
        if sys_upmethod is not None:
            if sys_upmethod['remote'] != cfg["remote"]:
                log.logger.debug("remote mode changed, delete all firmware file in {0}".format(FIRMWARE_FILE_PATH))
                if os.path.isdir(FIRMWARE_FILE_PATH):
                    for file in os.listdir(FIRMWARE_FILE_PATH):
                        file_full_path = os.path.join(FIRMWARE_FILE_PATH, file)
                        os.remove(file_full_path)
                mgt_files = db.query("Device_Firmware_FileMgmt", {"domain_id": domain_id})
                if mgt_files:
                    for mgt_file in mgt_files:
                        dev_type_id = mgt_file['dev_type_id']
                        firmware_ver = mgt_file['fimware_ver']
                        db.delete("Device_Firmware_FileMgmt", {"id": mgt_file['id']})
                        db.update("System_Config_DeviceUpgrade", {"plan_version": "R0.0.00.000"},
                                  {"dev_type_id": dev_type_id, "plan_version": firmware_ver})
            res = db.update("System_Config_UpgradeMethod", cfg, {"id": sys_upmethod['id']})
        else:
            res = db.insert("System_Config_UpgradeMethod", cfg)
        closeDB(db)
        return res
    else:
        log.logger.error("db is none!")
        return False


@app.task
def system_config_backup_task():
    resp = None
    backup_path = TMP_EXPORT_CFG_PATH
    if not os.path.exists(backup_path):
        os.mkdir(backup_path)
    backup_file = TMP_EXPORT_CFG_PATH + SYS_CFG_FILE
    cmd = MYSQL_DUMP + " " + DATABASE + " > " + backup_file
    if os.system(cmd) == 0:
        ret = encrypt_sys_config(backup_file)
        if ret is True:
            log.logger.debug("Backup system configuration successful!")
            resp = "backup_success"
        else:
            resp = "backup_fail"
        if os.path.isfile(backup_file):
            os.remove(backup_file)
    else:
        log.logger.debug("Backup system configuration failed!")
        resp = "backup_fail"
    return resp


@app.task
def system_config_restore_task(file):
    resp = None
    ret = unencrypt_sys_config(file)
    if ret is True:
        unencrypt_file = TMP_IMPORT_CFG_PATH + SYS_CFG_FILE
        wss_stop_cmd = WSS_START_SH + " stop"
        if os.system(wss_stop_cmd) == 0:
            log.logger.info("stop wss server success!")
        else:
            log.logger.info("stop wss server failed!")
            return "restore_fail"
        time.sleep(3)
        cmd = MYSQL + " -uroot -p123456 " + DATABASE + " < " + unencrypt_file
        if os.system(cmd) == 0:
            log.logger.debug("Restore system configuration successful!")
            resp = "restore_success"
        else:
            log.logger.debug("Restore system configuration failed!")
            resp = "restore_fail"
        time.sleep(3)
        wss_start_cmd = WSS_START_SH + " start"
        if os.system(wss_start_cmd) == 0:
            log.logger.info("start wss server success!")
        else:
            log.logger.info("start wss server failed!")
    else:
        resp = "file_error"
    if os.path.isfile(file):
        os.remove(file)
    return resp