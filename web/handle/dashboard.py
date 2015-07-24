__author__ = 'mouxiaohuan'

import tornado.web
import tornado.gen
import os.path
import time
import tcelery
from task import *
import json
from common.log import *
from web.handle.HomeHandler import BaseHandler
from web.handle.config_device import *
from web.auth_handle import *


class GetNetworkApHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        domain_id = str(self.get_cookie("domain_id"))
        resp = yield tornado.gen.Task(task.get_domain_networkaps_task.apply_async, args=[domain_id])
        resp_json = json.dumps(resp.result)
        self.write(resp_json)


class GetApCpuHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        domain_id = str(self.get_cookie("domain_id"))
        resp = yield tornado.gen.Task(task.get_apcpu_task.apply_async, args=[domain_id])
        resp_json = json.dumps(resp.result)
        self.write(resp_json)


class GetDomainMapHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        domain_name = self.get_argument("domain_name")
        resp = yield tornado.gen.Task(task.get_domain_map_task.apply_async, args=[domain_name])
        dmaps = resp.result
        datas = json.dumps(dmaps)
        self.write(datas)
