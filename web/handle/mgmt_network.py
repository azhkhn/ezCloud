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





class NetworkListSearchGetHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        search_info = self.get_argument("search_info")
        resp = yield tornado.gen.Task(task.get_network_list_search_task.apply_async, args=[{'search_info':search_info}])
        nwlists = resp.result
        datas = json.dumps(nwlists)
        self.write(datas)


class NetworkListGetHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        resp = yield tornado.gen.Task(task.get_network_list_task.apply_async, args=[])
        nwlists = resp.result
        datas = json.dumps(nwlists)
        self.write(datas)


# base on all network
class GetDeviceTypeHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        resp = yield tornado.gen.Task(task.get_capability_devtype_task.apply_async, args=[])
        devtype = resp.result
        if devtype:
            resp_json = json.dumps(devtype)
            self.write(resp_json)


class GetFirmwareListHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        domain_id = int(self.get_cookie("domain_id"))
        resp = yield tornado.gen.Task(task.get_firmware_list_task.apply_async, args=[domain_id])
        fwlists = resp.result
        resp_json = json.dumps(fwlists)
        self.write(resp_json)


class GetFirmwareFileHandler(BaseHandler):
    # for upgrade, no need auth
    # @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        try:
            filename = self.get_argument("filename")
        except:
            filename = None
            log.logger.error("miss filename argument!")
        if filename:
            self.set_header('Content-Type', 'application/octet-stream')
            self.set_header('Content-Disposition', 'attachment; filename='+filename)
            path = FIRMWARE_FILE_PATH
            file = os.path.join(path, filename)
            if os.path.exists(file):
                with open(file, 'rb') as f:
                    while True:
                        data = f.read(1024)
                        if not data:
                            break
                        self.write(data)
            else:
                log.logger.error("file '{0}' is not exist!".format(file))
        self.finish()


class GetNetworkMapHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        network_id = int(self.get_argument("network_id"))
        resp = yield tornado.gen.Task(task.get_network_map_task.apply_async, args=[network_id])
        nwmap = resp.result
        resp_json = json.dumps(nwmap)
        self.write(resp_json)


class UploadFirmwareHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        filename = None
        action = self.get_argument("action")
        if action == "delete":
            fid = int(self.get_argument("fid"))
            delkey = {"id": fid}
            resp = yield tornado.gen.Task(task.delete_firmware_task.apply_async, args=[delkey])
            return self.render("management-firmware.html", add_back_info=resp.result)
        fimware_ver = self.get_argument("firmware_ver")
        dev_type_id = int(self.get_argument("dev_type_id"))
        devtype = self.get_argument("dev_type")
        upload_path = FIRMWARE_FILE_PATH
        file_metas = self.request.files['upgrade_file']
        for meta in file_metas:
            filename = meta['filename']
            filepath = os.path.join(upload_path, filename)
            with open(filepath, 'wb') as up:
                up.write(meta['body'])
        new_file_name = devtype + fimware_ver
        if filename is not None:
            new_file = os.path.join(upload_path, new_file_name)
            os.rename(os.path.join(upload_path, filename), new_file)
            # upload_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time()))
            file_descript = self.get_argument("file_descript")
            official_release = int(self.get_argument("official_release"))
            domain_id = int(self.get_cookie("domain_id"))
            filecfg = {'fimware_ver': str(fimware_ver), 'dev_type_id': int(dev_type_id),
                       'file_name': str(new_file_name), "domain_id": domain_id,
                       'file_descript': str(file_descript), 'official_release': int(official_release)}
            resp = yield tornado.gen.Task(task.add_firmware_task.apply_async, args=[filecfg, upload_path, new_file_name])
            back_info = [{'upload': resp.result}]
            respJson = json.dumps(back_info)
            self.write(respJson)
        else:
            log.logger.error("upload firmware file fail!!!")
            back_info = [{'upload': "upload_fail"}]
            respJson = json.dumps(back_info)
            self.write(respJson)

    @BaseHandler.auth
    def get(self, *args, **kwargs):
        self.render("management-firmware.html", add_back_info="ok")


class ConfigureNetworkHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        action = self.get_argument("action")
        if action == "delete":
            nid = int(self.get_argument("network_id"))
            delkey = {"id": nid}
            resp = yield tornado.gen.Task(task.delete_network_task.apply_async, args=[delkey])
            return self.render("management-network.html", add_back_info=resp.result)
        network_name = self.get_argument("addNetworkName")
        domain_id = int(self.get_cookie("domain_id"))
        nwcfg = {'network_name': network_name, 'domain_id': domain_id}
        resp = yield tornado.gen.Task(task.add_network_task.apply_async, args=[nwcfg])
        self.render("management-network.html", add_back_info="ok")

    def get(self, *args, **kwargs):
        self.render("management-network.html", add_back_info="ok")


class GetNetworkUpgradeRuleHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        resp = yield tornado.gen.Task(task.get_network_upgrade_rule_task.apply_async, args=[])
        nwfws = resp.result
        resp_json = json.dumps(nwfws)
        self.write(resp_json)


class ConfigureNetworkUpRuleHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        network_id = int(self.get_argument("network_id"))
        dev_type_id = self.get_argument("dev_type_id")
        plan_version = self.get_argument("plan_version")
        nwfwcfg = {'network_id': network_id, "dev_type_id": dev_type_id, "plan_version": plan_version}
        resp = yield tornado.gen.Task(task.config_network_upgrade_task.apply_async, args=[nwfwcfg])
        self.render("management-networkconfig.html")

    def get(self, *args, **kwargs):
        self.render("management-networkconfig.html")


class ConfigureNetworkBasicHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        network_id = int(self.get_argument("network_id"))
        network_name = self.get_argument("network_name")
        auto_upgrade = self.get_argument("auto_upgrade")
        network_basic_cfg = {"id": network_id, "network_name": network_name, "auto_upgrade": auto_upgrade}
        resp = yield tornado.gen.Task(task.edit_network_task.apply_async, args=[network_basic_cfg])
        self.render("management-networkconfig.html")

    def get(self, *args, **kwargs):
        self.render("management-networkconfig.html")


class UploadNetworkMapHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        network_id = int(self.get_argument("network_id"))
        map_type = int(self.get_argument("map_type"))
        address = "CHINA"
        longitude = float(self.get_argument("longitude"))
        latitude = float(self.get_argument("latitude"))
        zoomlevel = int(self.get_argument("zoomlevel"))
        storey_height = int(self.get_argument("storey_height"))       
        floor_id = int(self.get_argument("floor_select"))
        action = self.get_argument("map_action")
        if action == "delete":
            delkey = {"network_id": network_id, "map_type":map_type, "floor_id":floor_id}
            resp = yield tornado.gen.Task(task.delete_network_map_task.apply_async, args=[delkey])
            return self.render("management-networkconfig.html")
        else:
            if map_type == 0:
                map_cfg = {"network_id": network_id,"longitude": longitude, "latitude": latitude, "zoomlevel":zoomlevel}
                resp = yield tornado.gen.Task(task.network_map_save_task.apply_async, args=[map_cfg])
                return self.render("management-networkconfig.html")
        upload_path = os.path.join(os.path.dirname(__file__), '../static/images/maps')
        file_metas = self.request.files['map_file']
        for meta in file_metas:
            filename = meta['filename']
            filepath = os.path.join(upload_path, filename)
            with open(filepath, 'wb') as up:
                up.write(meta['body'])
        network_map_cfg = {"network_id": network_id,"address":address, 
        	"longitude": longitude, "filename":filename, "latitude": latitude, "zoomlevel":zoomlevel,
        	"storey_height":storey_height,"floor_id":floor_id	}
        resp = yield tornado.gen.Task(task.network_planemap_save_task.apply_async, args=[network_map_cfg])
        self.render("management-networkconfig.html")


class GetSystemInfoHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        domain_id = int(self.get_cookie("domain_id"))
        resp = yield tornado.gen.Task(task.get_system_info_task.apply_async, args=[domain_id])
        system_info = resp.result
        resp_json = json.dumps(system_info)
        self.write(resp_json)
