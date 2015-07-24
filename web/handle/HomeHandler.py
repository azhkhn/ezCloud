#!/usr/bin/env python
# -*- coding:UTF-8 -*-

__author__ = 'avy'
__date__ = '15-1-10'
__time__ = '10:09'
__description__ = 'HomeHandler'

import tornado.web
import tornado.gen
import os.path
from web.handle.BaseHandler import *
from common.log import *


class HomeHandler(BaseHandler):
    @BaseHandler.auth
    def get(self, *args, **kwargs):
        self.render("dashboard.html")

    def post(self, *args, **kwargs):
        pass


class PageHandler(BaseHandler):
    @BaseHandler.auth
    def get(self, *args, **kwargs):
        self.render(args[0]+".html")

    def post(self, *args, **kwargs):
        pass


class MonitorOverviewPageHandler(BaseHandler):
    @BaseHandler.auth
    def get(self, *args, **kwargs):
        self.render("monitor-overview.html", back_network_id=1)

    def post(self, *args, **kwargs):
        pass


class OverviewPageHandler(BaseHandler):
    @BaseHandler.auth
    def get(self, *args, **kwargs):
        self.render("configure-overview.html", back_network_name="default_network", add_back_info="ok")

    def post(self, *args, **kwargs):
        pass


class SsidPageHandler(BaseHandler):
    @BaseHandler.auth
    def get(self, *args, **kwargs):
        self.render("configure-ssid.html", back_network_name="default_network", add_back_info="ok")

    def post(self, *args, **kwargs):
        pass


class DevicePageHandler(BaseHandler):
    @BaseHandler.auth
    def get(self, *args, **kwargs):
        self.render("configure-device.html", add_back_info="ok")

    def post(self, *args, **kwargs):
        pass


class SsidSummaryPageHandler(BaseHandler):
    @BaseHandler.auth
    def get(self, *args, **kwargs):
        self.render("configure-ssidsummary.html", back_network_name="default_network", add_back_info="ok")

    def post(self, *args, **kwargs):
        pass
        

class SystemPageHandler(BaseHandler):
    @BaseHandler.auth
    def get(self, *args, **kwargs):
        self.render("management-system.html", add_back_info="ok")

    def post(self, *args, **kwargs):
        pass


class UserconfigPageHandler(BaseHandler):
    @BaseHandler.auth
    def get(self, *args, **kwargs):
         self.render("management-userconfig.html",add_back_userinfo="ok")

    def post(self, *args, **kwargs):
        pass


class UseraddconfigPageHandler(BaseHandler):
    @BaseHandler.auth
    def get(self, *args, **kwargs):
        self.render("management-user.html", add_back_userinfo="ok")

    def post(self, *args, **kwargs):
        pass


class FirmwarePageHandler(BaseHandler):
    @BaseHandler.auth
    def get(self, *args, **kwargs):
        self.render("management-firmware.html", add_back_info="ok")

    def post(self, *args, **kwargs):
        pass


class NetworkPageHandler(BaseHandler):
    @BaseHandler.auth
    def get(self, *args, **kwargs):
        self.render("management-network.html", add_back_info="ok")

    def post(self, *args, **kwargs):
        pass