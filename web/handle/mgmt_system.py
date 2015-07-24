__author__ = 'wangtao'

import tornado.web
import tornado.gen
import os.path
import time
import tcelery
from task import *
from web.handle.HomeHandler import BaseHandler
import json
from common.log import *
from common.util import *


class GetCountryListHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        resp = yield tornado.gen.Task(task.get_country_code_list_task.apply_async, args=[])
        country_list = resp.result
        resp_json = json.dumps(country_list)
        self.write(resp_json)


class GetSystemUpgradeMethodHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        domain_id = int(self.get_cookie("domain_id"))
        resp = yield tornado.gen.Task(task.get_system_upgrade_method_task.apply_async, args=[domain_id])
        up_method = resp.result
        resp_json = json.dumps(up_method)
        self.write(resp_json)


class GetSystemBasicHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        domain_id = int(self.get_cookie("domain_id"))
        resp = yield tornado.gen.Task(task.get_system_basic_task.apply_async, args=[domain_id])
        basic_cfg = resp.result
        resp_json = json.dumps(basic_cfg)
        self.write(resp_json)


class ConfigureSystemBasicHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        domain_id = int(self.get_cookie("domain_id"))
        time_zone = self.get_argument("time_Zone")
        country_code = self.get_argument("radio_country")
        system_basic_cfg = {'id': domain_id, "timezone": time_zone, "country_code": country_code}
        resp = yield tornado.gen.Task(task.set_system_basic_task.apply_async, args=[system_basic_cfg])
        self.render("management-system.html", add_back_info=resp.result)

    def get(self, *args, **kwargs):
        self.render("management-system.html", add_back_info="ok")


class ConfigureSystemUpgradeMethodHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        domain_id = int(self.get_cookie("domain_id"))
        upgrade_mode = self.get_argument("upgrade_mode")
        remote_enable = int(self.get_argument("remote_enabled"))
        if upgrade_mode != "http" and upgrade_mode != "https":
            upgrade_server = self.get_argument("upgrade_server")
        else:
            upgrade_server = ""
        upgrade_user = self.get_argument("upgrade_user")
        upgrade_passwd = self.get_argument("upgrade_passwd")
        up_method_cfg = {'domain_id': domain_id, "upgrade_mode": upgrade_mode,
                         "upgrade_server": upgrade_server, "upgrade_user": upgrade_user,
                         "upgrade_password": upgrade_passwd, "remote": remote_enable}
        resp = yield tornado.gen.Task(task.set_system_upgrade_method_task.apply_async, args=[up_method_cfg])
        self.render("management-system.html", add_back_info=resp.result)

    def get(self, *args, **kwargs):
        self.render("management-system.html", add_back_info="ok")


class ConfigureSystemManagementHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        action = self.get_argument("admin_action")
        if action == "export":
            resp = yield tornado.gen.Task(task.system_config_backup_task.apply_async, args=[])
            if resp.result == "backup_success":
                filename = ENCRYPT_SYS_CFG_FILE
                file = TMP_EXPORT_CFG_PATH + filename
                self.set_header('Content-Type', 'application/octet-stream')
                self.set_header('Content-Disposition', 'attachment; filename='+filename)
                try:
                    with open(file, 'rb') as f:
                        while True:
                            data = f.read(1024)
                            if not data:
                                break
                            self.write(data)
                    return self.finish()
                except:
                    log.logger.error("open file '{0}' failed!".format(file))
                    return self.render("management-system.html", add_back_info="backup_fail")
            else:
                return self.render("management-system.html", add_back_info="backup_fail")
        elif action == "import":
            if not os.path.exists(TMP_IMPORT_CFG_PATH):
                os.mkdir(TMP_IMPORT_CFG_PATH)
            file_metas = self.request.files['upgrade_file']
            for meta in file_metas:
                filename = meta['filename']
                filepath = os.path.join(TMP_IMPORT_CFG_PATH, filename)
                try:
                    with open(filepath, 'wb') as up:
                        up.write(meta['body'])
                except:
                    log.logger.error("open file '{0}' failed!".format(filepath))
                    return self.render("management-system.html", add_back_info="restore_fail")
            resp = yield tornado.gen.Task(task.system_config_restore_task.apply_async, args=[filepath])
            back_info=[{'upload_file':resp.result}]
            respJson = json.dumps(back_info)
            self.write(respJson)
            #return self.render("management-system.html", add_back_info=resp.result)
        else:
            log.logger.error("unknown action!")
            return self.render("management-system.html", add_back_info="unknown_action")

    def get(self, *args, **kwargs):
        self.render("management-system.html", add_back_info="ok")


class SystemRebootHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        action = self.get_argument("reboot_action")
        if action == "reboot":
            if os.system("reboot") == 0:
                log.logger.debug("reboot system successful!")
                resp = "reboot_success"
            else:
                log.logger.debug("reboot system failed!")
                resp = "reboot_fail"
            back_info=[{'reboot':resp}]
            respJson = json.dumps(back_info)
            self.write(respJson)
        elif action == "restart":
            cmd = "/opt/wms/ezCloud/start_ac_server restart"
            if os.system(cmd) == 0:
                log.logger.debug("restart system successful!")
                resp = "restart_success"
            else:
                log.logger.debug("restart system failed!")
                resp = "restart_fail"
            back_info=[{'restart':resp}]
            respJson = json.dumps(back_info)
            self.write(respJson)
        else:
            log.logger.error("unknown action!")
            return self.render("management-system.html", add_back_info="unknown_action")



