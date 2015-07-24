__author__ = 'avygong'


import task.util
from task.util import *


@app.task
def get_network_devices_task(nid,start, offset):
    db = connectDB()
    if db is not None:
        total_num = db.query_records_num("Device_Config_Basic", {'network_id': nid})
        ret = []
        record_info = {}
        record_info['data_type'] = "summary"
        if total_num:
            record_info['total'] = total_num
        else:
            record_info['total'] = 0
        record_info['start'] = start
        record_info['offset'] = offset
        ret.append(record_info)
        nwdevs = db.query("Device_Config_Basic", {'network_id': nid}, start=start, offset=offset)
        if nwdevs:
            for dev in nwdevs:
                device_stat = db.query_one("Device_Status_Basic", {'dev_id': dev['id']})
                if device_stat:
                    dev_state = device_stat['dev_state']
                    dev_uptime = device_stat['dev_uptime']
                else:
                    dev_state = 0
                    dev_uptime = 0
                ssid_num = db.query_field_count("Device_Status_Client",{'dev_id': dev['id']}, field="ssid_index")
                if ssid_num is None:
                    ssid_num = 0
                sta_num = db.query_field_count("Device_Status_Client",{'dev_id': dev['id']}, field="sta_mac")
                if sta_num is None:
                    sta_num = 0
                
                devtype = db.query_one("Device_Type_Define", {'id': dev['dev_type_id']})
                dev_vendor = devtype['dev_vendor']
                
                device_map = db.query_one("Device_Config_Map", {'dev_id': dev['id']})
                if device_map:
                    ret.append({"id": dev['id'], "dev_name": dev['dev_name'], "dev_vendor":dev_vendor,
                    	  "dev_sn":dev['dev_sn'],"dev_mac":dev['dev_mac'], "dev_state": dev_state,"dev_uptime":dev_uptime,
                        "monitored": dev['monitored'],"ssid_num": ssid_num, "sta_num": sta_num,"map_marker":1,
                        "longitude":device_map['dev_longitude'],"latitude":device_map['dev_latitude'],
                        "floor_id":device_map['floor_id']})
                else:
                    ret.append({"id": dev['id'], "dev_name": dev['dev_name'], "dev_state": dev_state,"dev_uptime":dev_uptime,
                        "monitored": dev['monitored'],"ssid_num": ssid_num, "sta_num": sta_num,
                        "map_marker":0, "longitude":0, "latitude":0, "floor_id":0})
            closeDB(db)
        else:
            log.logger.error("network device list is null!")
            closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_monitored_devices_task(nid,domain_id):
    db = connectDB()
    if db is None:
        log.logger.error("db is none!")
        return None
    mntdevs = []
    devices = db.query("Device_Config_Basic", {'network_id': nid, 'monitored': 1})
    if devices:
        for dev in devices:
            device_stat = db.query_one("Device_Status_Basic", {'dev_id': dev['id']})
            if device_stat:
                dev_state = device_stat['dev_state']
            else:
                dev_state = 0
            mntdevs.append({"dev_id": dev['id'], "dev_name": dev['dev_name'], "dev_state": dev_state})
        domain_cfg = db.query_one("System_Config_Domain", {"id": domain_id})
        if domain_cfg:
            mntdevs.append({"timezone":domain_cfg['timezone']})
        closeDB(db)
        return mntdevs
    else:
        log.logger.error("the device not exsit!")
        closeDB(db)
        return None


@app.task
def get_specific_network_data_task(nid):
    db = connectDB()
    if db is not None:
        ret = []
        client_status = db.query_all("Device_Status_Client")
        if client_status:
            for i in client_status:
                devid = i['dev_id']
                clientid = i['id']
                device = db.query_one("Device_Config_Basic", {"id": devid})
                client_pm = db.query_one("Device_Pm_Client", {"client_id": clientid})
                network_id = device['network_id']
                if network_id == nid and device and client_pm:
                    ret.append({"dev_name": device['dev_name'], "sta_mac": i['sta_mac'],
                                "ssid_name": i['ssid_name'], "connected_time": i['connected_time'],
                                "idle_time": i['idle'], "signal": i['rssi'],
                                "txbyte": client_pm['sta_upstream_bytes'],
                                "rxbyte": client_pm['sta_downstream_bytes']})
        closeDB(db)
        return ret
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_device_pm_data_task(network_id):
    db = connectDB()
    pmData = []
    if db is not None:
        pmlist = db.query_all("Device_Pm_Radio")
        if pmlist:
            for u in pmlist:
                devid = int(u['dev_id'])
                dev = db.query_one("Device_Config_Basic",{'id':devid})
                if dev:
                    nid = int(dev['network_id'])
                    #print("nid is %d"%nid)
                    dev_name = dev['dev_name']
                    if(nid != int(network_id)):
                        continue
                    st = str(u['report_time'])
                    tm = datetime.datetime.strptime(st,"%Y-%m-%d %H:%M:%S")
                    dt = int(time.mktime(tm.timetuple()))*1000
                    #now = int(time.time()*1000)
                    systime = get_systime_int(dev['timezone'])
                    now = int(systime)*1000
                    if( dt < now - 5*60*1000):                        
                        continue
                    pmData.append({'radio_id':u['radio_id'],'dev_id':u['dev_id'],'dev_name':dev_name,
                    	'tx_bytes_rate':u['tx_bytes_rate'], 'rx_bytes_rate':u['rx_bytes_rate'],'report_time':dt,
                    	'tx_packets_rate':u['tx_packets_rate'], 'rx_packets_rate':u['rx_packets_rate'],
                    	'tx_bytes':u['tx_bytes'],'rx_bytes':u['rx_bytes'],'tx_packets':u['tx_packets'],'rx_packets':u['rx_packets'],                    	
                    	'tx_drop_pkts':u['tx_drop_pkts'],'rx_drop_pkts':u['rx_drop_pkts'],
                    	'tx_retry_pkts':u['tx_retry_pkts'],'rx_err_pkts':u['rx_err_pkts']})	
                else:
                    log.logger.debug("Device_Config_Basic is none!")
                    closeDB(db)
                    return None
            if pmData:
                closeDB(db)
                return pmData
            else:
                log.logger.debug("pmData is none!")
                closeDB(db)
                return None
        else:
            log.logger.error("Device_Pm_Radio is none!")
            closeDB(db)
            return None
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_device_link_status_task(devid):
    db = connectDB()
    if db is not None:
        ret = []
        #lastTime = db.query_one('select max(id) Device_Log from where dev_id=%s',devid)
        link_status = db.query("Device_Alarm", {"dev_id": devid})
        if link_status:
            for i in link_status:
                ret.append({"dev_id": i['dev_id'], "dev_alm_action": i['dev_alm_action'],
                            "dev_alm_time": str(i['dev_alm_time'])})
        if ret:
            closeDB(db)
            return ret
    log.logger.error("db is none!")
    return None


@app.task
def get_device_heartbeat_log_task(devid):
    redis = connect_redis()
    if redis is not None:
        report_time = redis.hget(devid, "date_time")
        if report_time:
            report_time = redis_string_convert(report_time)
            ret = []
            ret.append({'dev_id': devid, 'dev_log_time': report_time})
            return ret
    log.logger.error("db is none!")
    return None


@app.task
def set_network_device_monitor_task(network_id, monitor_devlist):
    db = connectDB()
    ret = False
    if db is not None:        
        nwdevs = db.query("Device_Config_Basic", {'network_id': network_id})
        if nwdevs:
            for dev in nwdevs:
                if str(dev['id']) not in monitor_devlist:
                    ret = db.update("Device_Config_Basic", {'monitored': 0},{ 'id':dev['id']})
                else:
                    ret = db.update("Device_Config_Basic", {'monitored': 1},{ 'id':dev['id']})
        if ret is True:
            notify_cfg_changed("cfg_change")
        closeDB(db)
    else:
        log.logger.error("db is none!")
        return None