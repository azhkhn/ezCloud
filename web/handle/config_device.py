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


class GetConfigureOverviewsearchHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        network = self.get_argument("network")
        device_name_search = self.get_argument("search_info")
        resp = yield tornado.gen.Task(task.get_device_info_search_task.apply_async, args=[network,device_name_search])
        device_infos = resp.result
        if device_infos:
            resp_json = json.dumps(device_infos)
            self.write(resp_json)


class GetConfigureOverviewHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        network = self.get_argument("network")
        offset = self.get_argument("offset")
        start = self.get_argument("start")
        resp = yield tornado.gen.Task(task.get_device_info_task.apply_async, args=[network, start, offset])
        device_infos = resp.result
        if device_infos:
            resp_json = json.dumps(device_infos)
            self.write(resp_json)


class GetNetworkNameHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        resp = yield tornado.gen.Task(task.get_network_name_list_task.apply_async, args=[])
        device_infos = resp.result
        if device_infos:
            resp_json = json.dumps(device_infos)
            self.write(resp_json)


class GetConfigureAddDevHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        resp = yield tornado.gen.Task(task.get_device_type_task.apply_async, args=[])
        device_type = resp.result
        if device_type:
            resp_json = json.dumps(device_type)
            self.write(resp_json)


class GetConfigureDevHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        network = self.get_argument("network")
        device = self.get_argument("device")
        resp = yield tornado.gen.Task(task.get_device_cfg_task.apply_async, args=[network, device])
        device_cfg = resp.result
        if device_cfg:
            resp_json = json.dumps(device_cfg)
            self.write(resp_json)


class GetDevListsearchHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        network = self.get_argument("network")
        device_name_search = self.get_argument("search_info")
        resp = yield tornado.gen.Task(task.get_device_list_search_task_task.apply_async, args=[network,device_name_search])
        device_cfg = resp.result
        if device_cfg:
            resp_json = json.dumps(device_cfg)
            self.write(resp_json)


class GetDevListHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        network = self.get_argument("network")
        offset = self.get_argument("offset")
        start = self.get_argument("start")
        resp = yield tornado.gen.Task(task.get_device_list_task.apply_async, args=[network, start, offset])
        device_cfg = resp.result
        if device_cfg:
            resp_json = json.dumps(device_cfg)
            self.write(resp_json)


class GetRadio2SSIDHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        network = self.get_argument("network")
        device = self.get_argument("device")
        resp = yield tornado.gen.Task(task.get_radio2ssid_task.apply_async, args=[network, device])
        radio2ssid_cfg = resp.result
        if radio2ssid_cfg:
            respJson = json.dumps(radio2ssid_cfg)
            self.write(respJson)


class AddDeviceHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        network_name = self.get_argument("network_name")
        add_way = self.get_argument("add_way")
        if add_way == "1":
            filepath = None
            upload_path = FIELS_PATH
            file_metas = self.request.files['dev_file']
            for meta in file_metas:
                filename = meta['filename']
                filepath = os.path.join(upload_path, filename)
                with open(filepath, 'wb') as up:
                    up.write(meta['body'])
            resp =yield tornado.gen.Task(task.add_many_devices_cfg_task.apply_async, args=[filepath, network_name])
        else:
            device_cfg = {}
            device_cfg['dev_sn'] = self.get_argument("dev_sn")
            device_cfg['dev_mac'] = self.get_argument("dev_mac")
            device_cfg['dev_model'] = self.get_argument("devtype_sel")
            device_cfg['network_name'] = network_name
            resp = yield tornado.gen.Task(task.add_device_cfg_task.apply_async, args=[device_cfg])
        self.render("configure-overview.html", back_network_name=network_name, add_back_info=resp.result)

    @BaseHandler.auth
    def get(self, *args, **kwargs):
        self.render("configure-overview.html", back_network_name="default_network", add_back_info="ok")


class OperateDeviceHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        action = self.get_argument("action")
        device = self.get_argument("dev_name")
        network_name = self.get_argument("network")
        resp = yield tornado.gen.Task(task.operate_device_task.apply_async, args=[action, device])
        if action == "reboot":
            self.render("configure-device.html", add_back_info="ok")
        else:
            self.render("configure-overview.html", back_network_name=network_name, add_back_info="ok")

    def get(self, *args, **kwargs):
        self.render("configure-device.html", add_back_info="ok")


class ConfigureDevBasicHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        try:
            dev_id = self.get_argument("dev_id")
            dev_name = self.get_argument("dev_name_basic")
            dev_basic_cfg = {"dev_name": dev_name}
            resp = yield tornado.gen.Task(task.set_device_basic_cfg_task.apply_async, args=[dev_id, dev_basic_cfg])
        except:
            log.logger.error("get argument fail")
        self.render("configure-device.html", add_back_info=resp.result)

    def get(self, *args, **kwargs):
        self.render("configure-device.html", add_back_info="ok")


class ConfigureDevRadioHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        try:
            cur_dev_name = self.get_argument("dev_name")
            support_2g = self.get_argument("support_2g")
            support_5g = self.get_argument("support_5g")
            dev_radio_cfg = {}
            if support_2g == '1':
                dev_radio_cfg['radio_2g_role'] = self.get_argument("2g_radio_role")
                dev_radio_cfg['radio_2g_mode'] = self.get_argument("2g_radio_mode")
                dev_radio_cfg['radio_2g_channel'] = self.get_argument("2g_radio_channel")
                dev_radio_cfg['band_2g'] = self.get_argument("2g_channel_bandwidth")
                dev_radio_cfg['tx_2g_pwr'] = self.get_argument("2g_radio_power")
            if support_5g == '1':
                dev_radio_cfg['radio_5g_role'] = self.get_argument("5g_radio_role")
                dev_radio_cfg['radio_5g_mode'] = self.get_argument("5g_radio_mode")
                dev_radio_cfg['radio_5g_channel'] = self.get_argument("5g_radio_channel")
                dev_radio_cfg['band_5g'] = self.get_argument("5g_channel_bandwidth")
                dev_radio_cfg['tx_5g_pwr'] = self.get_argument("5g_radio_power")
            resp = yield tornado.gen.Task(task.set_device_radio_cfg_task.apply_async, args=[cur_dev_name, dev_radio_cfg, support_2g, support_5g])
        except:
            log.logger.error("get argument fail")
        self.render("configure-device.html", add_back_info="ok")

    def get(self, *args, **kwargs):
        self.render("configure-device.html", add_back_info="ok")


class ConfigureDevSSIDHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        try:
            network = self.get_argument("network")
            radio = self.get_argument("radio_type")
            ssid_on = self.get_argument("ssid_on")
            dev_ssid_cfg = {}
            dev_ssid_cfg['dev_id'] = self.get_argument("dev_id")
            # dev_ssid_cfg['ssid_index'] = self.get_argument("ssid_index")
            dev_ssid_cfg['ssid_template_id'] = self.get_argument("ssid_tp")
            dev_ssid_cfg['ssid_vlan_id'] = self.get_argument("ssid_vlan")
            resp = yield tornado.gen.Task(task.set_device_radio2ssid_cfg_task.apply_async,
                                          args=[network, ssid_on, radio, dev_ssid_cfg])
        except:
            log.logger.error("get argument fail")
        self.render("configure-device.html", add_back_info=resp.result)

    def get(self, *args, **kwargs):
        self.render("configure-device.html", add_back_info="ok")


class ConfigureDevIPHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        dev_ip_cfg = {}
        try:
            dev_ip_cfg['dev_id'] = self.get_argument("dev_id")
            dev_ip_cfg['wanport_mode'] = self.get_argument("dev_ip_mode")
            dev_ip_cfg['wanport_vlan'] = self.get_argument("dev_vlan")
            dev_ip_cfg['wanport_ip'] = self.get_argument("dev_ipaddr")
            dev_ip_cfg['wanport_netmask'] = self.get_argument("dev_netmask")
            dev_ip_cfg['wanport_gateway'] = self.get_argument("dev_gw")
            dev_ip_cfg['wanport_dns1'] = self.get_argument("dev_dns1")
            dev_ip_cfg['wanport_dns2'] = self.get_argument("dev_dns2")
            dev_ip_cfg['wanport_detag'] = self.get_argument("vlan_detag")
            dev_ip_cfg['flag'] = 1
            resp = yield tornado.gen.Task(task.set_device_ip_cfg_task.apply_async, args=[dev_ip_cfg])
        except:
            log.logger.error("get argument fail")
        self.render("configure-device.html", add_back_info="ok")

    def get(self, *args, **kwargs):
        self.render("configure-device.html", add_back_info="ok")


class ConfigureDevUpgradeHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        dev_upgrade_cfg = {}
        try:
            dev_upgrade_cfg['id'] = self.get_argument("dev_id")
            dev_upgrade_cfg['auto_upgrade'] = self.get_argument("auto_upgrade")
            if dev_upgrade_cfg['auto_upgrade'] == "0":
                dev_upgrade_cfg['plan_version'] = self.get_argument("firmware_list")
            resp = yield tornado.gen.Task(task.set_device_upgrade_cfg_task.apply_async, args=[dev_upgrade_cfg])
        except:
            log.logger.error("get argument fail")
        self.render("configure-device.html", add_back_info="ok")

    def get(self, *args, **kwargs):
        self.render("configure-device.html", add_back_info="ok")


class ConfigureDevAdvanceHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        dev_mgt_cfg = {}
      #  try:
        dev_mgt_cfg['dev_id'] = self.get_argument("dev_id")
        dev_mgt_cfg['mgmt_ssh'] = self.get_argument("ssh_enabled")
        dev_mgt_cfg['mgmt_telnet'] = self.get_argument("telnet_enabled")
        dev_mgt_cfg['mgmt_http'] = self.get_argument("http_enabled")
        dev_mgt_cfg['mgmt_https'] = self.get_argument("https_enabled")
        dev_mgt_cfg['mgmt_syslog'] = self.get_argument("syslog_enabled")
        if dev_mgt_cfg['mgmt_syslog'] == "1":
            dev_mgt_cfg['mgmt_syslog_server'] = self.get_argument("f_remote_syslog_ip")
        resp = yield tornado.gen.Task(task.set_device_mgmt_cfg_task.apply_async, args=[dev_mgt_cfg])
      #  except:
          #  log.logger.error("get argument fail")
        self.render("configure-device.html", add_back_info="ok")

    def get(self, *args, **kwargs):
        self.render("configure-device.html", add_back_info="ok")


class DeleteDeviceBatchHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        try:
            action = self.get_argument("all_delete_device_id")
            devices = self.get_argument("delete_device_id")
            network_name = self.get_argument("network")
            resp = yield tornado.gen.Task(task.del_device_batch_task.apply_async, args=[action, devices, network_name])
            if resp.result is False:
                return self.render("configure-overview.html", back_network_name=network_name,
                                   add_back_info="del_fail")
        except:
            log.logger.error("get argument fail")
        self.render("configure-overview.html", back_network_name="default_network", add_back_info="ok")

    def get(self, *args, **kwargs):
        self.render("configure-overview.html", back_network_name="default_network", add_back_info="ok")


class ConfigureSSIDBatchHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        try:
            action = int(self.get_argument("ssid_status"))
            all_dev = int(self.get_argument("all_qute_ssid_id"))
            if all_dev == 1:
                devices = "all"
            else:
                devices = self.get_argument("qute_ssid_id")
            network_name = self.get_argument("network")
            dev_ssid_cfg = {}
            if action == 1:
                dev_ssid_cfg['radio_type'] = int(self.get_argument("Radio"))
                dev_ssid_cfg['ssid_template_id'] = self.get_argument("ssid_tp")
                dev_ssid_cfg['ssid_vlan_id'] = self.get_argument("ssid_vlan")
            else:
                dev_ssid_cfg['ssid_template_id'] = self.get_argument("ssid_tp")
            resp = yield tornado.gen.Task(task.config_device_ssid_batch_task.apply_async,
                                          args=[action, devices, network_name, dev_ssid_cfg])
            return self.render("configure-overview.html", back_network_name=network_name, add_back_info=resp.result)
        except:
            log.logger.error("get argument fail")
        self.render("configure-overview.html", back_network_name="default_network", add_back_info="ok")

    def get(self, *args, **kwargs):
        self.render("configure-overview.html", back_network_name="default_network", add_back_info="ok")


class AddDeviceMapHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        try:
            dev_map = {}
            cur_network = self.get_argument("cur_network")
            dev_id = int(self.get_argument("device_id"))
            action = self.get_argument("map_action")
            if action == "delete":
                resp = yield tornado.gen.Task(task.remove_device_map_info_task.apply_async, args=[dev_id])
                return self.render("configure-overview.html", back_network_name=cur_network, add_back_info="ok")
            dev_map['dev_id'] = dev_id           
            dev_map['floor_id'] = int(self.get_argument("floor_select"))
            dev_map['dev_longitude'] = float(self.get_argument("longitude"))
            dev_map['dev_latitude'] = float(self.get_argument("latitude"))
            log.logger.debug("dev_map{0}".format(dev_map))
            resp = yield tornado.gen.Task(task.set_device_map_task.apply_async, args=[dev_map])
        except:
            log.logger.error("get argument fail")
        return self.render("configure-overview.html", back_network_name=cur_network, add_back_info="ok")

    def get(self, *args, **kwargs):
        return self.render("configure-overview.html", back_network_name="default_network", add_back_info="ok")