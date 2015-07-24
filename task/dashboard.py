__author__ = 'mouxiaohuan'


import task.util
from task.util import *


"""
get/set/add/delele function
"""

@app.task
def get_domain_networkaps_task(domain_id):
    db = connectDB()
    if db is not None:
        all_networks_cfgs = []
        system_networkname_cfgs = db.query("System_Config_Network", {"domain_id":int(domain_id)})
        if system_networkname_cfgs:
            for system_networkname_cfg in system_networkname_cfgs:
                networks_onelist_infos = {}
                networks_onelist_infos['upok'] = system_networkname_cfg['up_ok']
                networks_onelist_infos['networks_name'] = system_networkname_cfg['network_name']
                total_num = db.query_records_num("Device_Config_Basic", {"network_id": system_networkname_cfg['id']})
                if total_num:
                    networks_onelist_infos['totalap'] = total_num
                else:
                    networks_onelist_infos['totalap'] = 0
                networks_device_Basics = db.query("Device_Config_Basic", {"network_id":system_networkname_cfg['id']})
                if networks_device_Basics:
                    onlineap=0
                    for networks_device_Basic in networks_device_Basics:
                        dev_states= db.query_one("Device_Status_Basic", {"dev_id": networks_device_Basic['id']})
                        if dev_states and (dev_states['dev_state']==1):
                            onlineap += 1
                    networks_onelist_infos['onlineap'] = onlineap
                all_networks_cfgs.append(networks_onelist_infos)
        else:
            log.logger.debug("networks is null")
        closeDB(db)
        if len(all_networks_cfgs) == 0:
            return None
        else:
            return all_networks_cfgs
    else:
        log.logger.error("db is none!")
        return None




@app.task
def get_apcpu_task(domain_id):
    db = connectDB()
    device_id=[]
    if db is not None:
        all_networks_cfgs = []
        system_networkname_cfgs = db.query("System_Config_Network", {"domain_id":int(domain_id)})
        if system_networkname_cfgs:
            for system_networkname_cfg in system_networkname_cfgs:
                networks_device_Basics = db.query("Device_Config_Basic", {"network_id":system_networkname_cfg['id']})
                if networks_device_Basics:
                    for networks_device_Basic in networks_device_Basics:
                        device_id.append(networks_device_Basic['id'])
            dev_cpustates= db.query("Device_Status_Basic", {"dev_id":device_id,"dev_state":1},is_and=False,sort_by="dev_cpu_utilize",is_desc="true", start=1, offset=3)
            if dev_cpustates:
                for dev_cpustate in dev_cpustates:
                    networks_onelist_infos = {}
                    dev_name= db.query_one("Device_Config_Basic", {"id": dev_cpustate['dev_id']})
                    networks_onelist_infos['type']='cpu'
                    networks_onelist_infos['dev_name']=dev_name['dev_name']
                    networks_onelist_infos['dev_cpu_utilize']=dev_cpustate['dev_cpu_utilize']
                    all_networks_cfgs.append(networks_onelist_infos)
            dev_constates= db.query("Device_Status_Basic", {"dev_id":device_id,"dev_state":1},is_and=False,sort_by="sta_num",is_desc="true", start=1, offset=3)
            if dev_cpustates:
                for dev_constate in dev_constates:
                    connectiont_infos = {}
                    dev_name_nut= db.query_one("Device_Config_Basic", {"id": dev_constate['dev_id']})
                    connectiont_infos['type']='connection '
                    connectiont_infos['dev_name']=dev_name_nut['dev_name']
                    connectiont_infos['dev_sta_num']=dev_constate['sta_num']
                    all_networks_cfgs.append(connectiont_infos)
        else:
            log.logger.debug("networks is null")
        closeDB(db)
        if len(all_networks_cfgs) == 0:
            return None
        else:
            return all_networks_cfgs
    else:
        log.logger.error("db is none!")
        return None

