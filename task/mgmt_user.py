__author__ = 'mouxiaohuan'


import task.util
from task.util import *


"""
get/set/add/delele function
"""

@app.task
def login_users_task(login_username, login_password, login_domain_name):
    db = connectDB()
    if db is not None:
        domain_ids = db.query_one("System_Config_Domain", {"domain_name": login_domain_name})
        if domain_ids:
            find_user_cfgs = db.query_one("System_Config_User", {"user_name": login_username, "domain_id": domain_ids['id']})
            if find_user_cfgs:
                if str(login_password) == find_user_cfgs['user_password']:
                    find_opteter_cfgs = db.query_one("System_Config_Group", {"id": find_user_cfgs['user_group_id']})
                    if find_opteter_cfgs:
                        optertor_mangement=str(find_opteter_cfgs['management_user'])+str(find_opteter_cfgs['management_networks'])+\
                                     str(find_opteter_cfgs['management_system'])+str(find_opteter_cfgs['configure'])+\
                                     str(find_opteter_cfgs['monitor'])+str(find_opteter_cfgs['diagnose'])+str(find_user_cfgs['user_group_id'])
                        resp={"login_ok":0,"page_optaretor":optertor_mangement,"urls":login_auth_url(db,login_username,login_domain_name)}
                        closeDB(db)
                        return resp
                else:
                    resp={"login_ok":1}
                    closeDB(db)
                    return resp
            else:
                log.logger.debug("user name error")
                closeDB(db)
                resp={"login_ok":2}
                return resp
    else:
        log.logger.error("db is none!")
        return None

def login_auth_url(db,login_username,login_domain_name):
    all_URL_cfgs = []
    domain_ids = db.query_one("System_Config_Domain",{"domain_name": login_domain_name})
    if domain_ids:
        one_group_cfg = db.query_one("System_Config_User", {"domain_id": domain_ids['id'],"user_name": login_username})
        if one_group_cfg:
            user_group_name = db.query_one("System_Config_Group", {"id": one_group_cfg['user_group_id']})
            user_URLs = db.query_all("System_Config_PageMapping")
            if user_group_name and user_URLs :
                if user_group_name['user_group_type']=='monitor':
                    for user_URL in user_URLs:
                        URL_infos_monitor = {}
                        URL_infos_monitor[ user_URL['uri']] = user_URL['monitor']
                        all_URL_cfgs.append(URL_infos_monitor)
                if user_group_name['user_group_type']=='operator':
                    for user_URL in user_URLs:
                        URL_infos_operator = {}
                        URL_infos_operator[ user_URL['uri']] = user_URL['operator']
                        all_URL_cfgs.append(URL_infos_operator)
                if user_group_name['user_group_type']=='administrator':
                    for user_URL in user_URLs:
                        URL_infos_administrator = {}
                        URL_infos_administrator[ user_URL['uri']] = user_URL['administrator']
                        all_URL_cfgs.append(URL_infos_administrator)
    else:
        log.logger.debug("domain is null")
    if len(all_URL_cfgs) == 0:
        return None
    else:
        return all_URL_cfgs


@app.task
def get_domain_users_task():
    db = connectDB()
    if db is not None:
        all_domain_cfgs = []
        user_domains = db.query_all("System_Config_Domain")
        if user_domains:
            for one_user_domain in user_domains:
                domain_name_infos = {}
                domain_name_infos['domain_name'] = one_user_domain['domain_name']
                domain_name_infos['domain_id'] = one_user_domain['id']
                all_domain_cfgs.append(domain_name_infos)
        else:
            log.logger.debug("domain is null")

        closeDB(db)
        if len(all_domain_cfgs) == 0:
            return None
        else:
            log.logger.debug("System_Config_Domain {0}".format(user_domains))
            return all_domain_cfgs
    else:
        log.logger.error("db is none!")
        return None


@app.task
def add_user_cfg_task(cfg):
    db = connectDB()
    if db is not None:
        user_group = db.query_one("System_Config_Group", {'user_group_type': cfg['user_group']})
        if user_group:
            name = {"user_name": cfg['user_name'], "domain_id": 1}
            check_user = db.query("System_Config_User", name)
            if check_user:
                log.logger.debug("add --user name has been exist ")
                closeDB(db)
                return 'add_error'
            else:
                user_cfg = {}
                user_cfg['user_group_id'] = user_group['id']
                user_cfg['user_name'] = cfg['user_name']
                user_cfg['domain_id'] = 1
                user_cfg['user_password'] = cfg['password']
                user_cfg['user_description'] = cfg['user_description']
                user_cfg['email'] = cfg['email']
                user_cfg['telephone'] = cfg['telephone']
                ret = db.insert("System_Config_User", user_cfg)
                if ret is False:
                    closeDB(db)
                    return ret
            closeDB(db)
            return True
        else:
            log.logger.error("add user error! because of user_group type unknown!")
            closeDB(db)
            return False
    else:
        log.logger.error("db is none!")
        return False


@app.task
def get_group_users_task(domain_name):
    db = connectDB()
    if db is not None:
        all_group_cfgs = []
        domain_ids = db.query_one("System_Config_Domain",{"domain_name": domain_name})
        if domain_ids:
            one_group_cfgs = db.query("System_Config_User", {"domain_id": domain_ids['id']})
            if one_group_cfgs:
                for one_group_cfg in one_group_cfgs:
                    user_groups = db.query_one("System_Config_Group", {"id": one_group_cfg['user_group_id']})
                    if user_groups:
                        group_name_infos = {}
                        group_name_infos['user_group_name'] = user_groups['user_group_type']
                        group_name_infos['id'] = one_group_cfg['id']
                        group_name_infos['user_name'] = one_group_cfg['user_name']
                        group_name_infos['user_description'] = one_group_cfg['user_description']
                        group_name_infos['telephone'] = one_group_cfg['telephone']
                        group_name_infos['email'] = one_group_cfg['email']
                        all_group_cfgs.append(group_name_infos)
        else:
            log.logger.debug("user_cfg is null")

        closeDB(db)
        if len(all_group_cfgs) == 0:
            return None
        else:
            log.logger.debug("System_Config_Group {0}".format(all_group_cfgs))
            return all_group_cfgs
    else:
        log.logger.error("db is none!")
        return None


@app.task
def get_current_user_groupId_task(current_name, domain_name):
    db = connectDB()
    if db is not None:
        all_group_cfgs = []
        domain_ids = db.query_one("System_Config_Domain", {"domain_name": domain_name})
        if domain_ids:
            one_group_cfgs = db.query_one("System_Config_User", {"user_name": current_name, "domain_id": domain_ids['id']})
            if one_group_cfgs:
                    group_name_infos = {}
                    group_name_infos['current_user_group_id'] = one_group_cfgs['user_group_id']
                    all_group_cfgs.append(group_name_infos)
        else:
            log.logger.debug("user_cfg is null")

        closeDB(db)
        if len(all_group_cfgs) == 0:
            return None
        else:
            log.logger.debug("System_Config_Group {0}".format(all_group_cfgs))
            return all_group_cfgs
    else:
        log.logger.error("db is none!")
        return None


@app.task
def edit_userinfo_cfg_task(cfg):
    db = connectDB()
    if db is not None:
        edit_user_cfg = db.query_one("System_Config_User", {'id': cfg['edit_user_name_id']})
        if edit_user_cfg:
                ret = db.update("System_Config_User", { 'user_description': cfg['edit_user_description'],
                         'email': cfg['edit_email'], 'telephone': cfg['edit_telephone']}, {'id': cfg['edit_user_name_id']})
                if ret is True:
                    notify_cfg_changed("cfg_change")
                    closeDB(db)
                    return ret
                else:
                    closeDB(db)
                    return 'edit_password_error'

        else:
            log.logger.error("user ID unknown!")
            closeDB(db)
            return False
    else:
        log.logger.error("db is none!")
        return False

@app.task
def edit_password_user_cfg_task(cfg):
    db = connectDB()
    if db is not None:
        user_group = db.query_one("System_Config_Group", {'user_group_type': cfg['edit_user_group']})
        if user_group:
            edit_user_cfg = db.query_one("System_Config_User", {'id': cfg['edit_user_name_id']})
            if edit_user_cfg:
                    if str(edit_user_cfg['user_password']) == str(cfg['edit_old_password']):
                        ret = db.update("System_Config_User", {'user_password': cfg['edit_password']}, {'id': cfg['edit_user_name_id'],'user_name': cfg['edit_user_name']})
                        if ret is True:
                            notify_cfg_changed("cfg_change")
                        closeDB(db)
                        return ret
                    else:
                        closeDB(db)
                        return 'edit_password_error'

        else:
            log.logger.error("add user error! because of user_group type unknown!")
            closeDB(db)
            return False
    else:
        log.logger.error("db is none!")
        return False


@app.task
def delete_user_task(delete_user_name_id):
    db = connectDB()
    if db is not None:
        user_name_id = delete_user_name_id
        name = {"id": user_name_id}
        user_exist = db.query("System_Config_User", name)
        if user_exist:
            log.logger.debug("del username cfg in DB")
            db.delete("System_Config_User", name, True)
        closeDB(db)
        return True
    else:
        log.logger.error("db is none!")
        return False








