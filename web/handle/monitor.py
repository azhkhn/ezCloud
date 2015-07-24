__author__ = 'avygong'

import tornado.web
import tornado.gen
import os.path
import json
import time
import tcelery
import task
from task import *
from web.handle.HomeHandler import BaseHandler
import json


class NetworkDeviceGetHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):       
        network_id = int(self.get_argument("network_id"))
        offset = self.get_argument("offset")
        start = self.get_argument("start")
        resp = yield tornado.gen.Task(task.get_network_devices_task.apply_async, args=[network_id,start,offset])
        nwdevs = resp.result
        respJson = json.dumps(nwdevs)
        self.write(respJson)


class MonitoredDeviceGetHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):       
        network_id = int(self.get_argument("network_id"))
        domain_id = int(self.get_cookie("domain_id"))
        resp = yield tornado.gen.Task(task.get_monitored_devices_task.apply_async, args=[network_id,domain_id])
        mntdevs = resp.result
        respJson = json.dumps(mntdevs)
        self.write(respJson)


class SpecificNetworkDataGetHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):       
        network_id = int(self.get_argument("network_id"))
        resp = yield tornado.gen.Task(task.get_specific_network_data_task.apply_async, args=[network_id])
        nwdevs = resp.result
        datas = json.dumps(nwdevs)
        self.write(datas)


class DevicePMGetHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        network_id = int(self.get_argument("network_id"))
        resp = yield tornado.gen.Task(task.get_device_pm_data_task.apply_async, args=[network_id])
        datas = resp.result
        respJson = json.dumps(datas)
        self.write(respJson)


class DeviceLinkStatusGetHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        dev_id = self.get_argument("cur_dev_id")
        resp = yield tornado.gen.Task(task.get_device_link_status_task.apply_async, args=[dev_id])
        datas = resp.result
        respJson = json.dumps(datas)
        self.write(respJson)


class NetworkDeviceMonitorSetHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        network_id = int(self.get_argument("monitor_networkid"))
        monitor_devlist = self.get_argument("monitor_devlist")
        resp = yield tornado.gen.Task(task.set_network_device_monitor_task.apply_async, args=[network_id,monitor_devlist])
        self.render("monitor-overview.html", back_network_id=network_id)


class DeviceHeartBeatLogGetHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        dev_id = self.get_argument("cur_dev_id")
        resp = yield tornado.gen.Task(task.get_device_heartbeat_log_task.apply_async, args=[dev_id])
        datas = resp.result
        respJson = json.dumps(datas)
        self.write(respJson)     
