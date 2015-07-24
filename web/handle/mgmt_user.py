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


class UserLoginHandler(BaseHandler):
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        login_username = self.get_argument("username")
        login_password = self.get_argument("password")
        login_language = self.get_argument("language")
        login_domain_name = self.get_argument("domain_name")
        login_domain_id = self.get_argument("domain_id")
        resp = yield tornado.gen.Task(task.login_users_task.apply_async,
                                      args=[login_username, login_password, login_domain_name])
        userinfo = resp.result["login_ok"]
        if userinfo == 0:
            self.set_cookie("username", self.get_argument("username"))
            self.set_cookie("Lgdomain", login_domain_name)
            self.set_cookie("Language", login_language)
            self.set_cookie("domain_id", login_domain_id)
            self.session.password = login_password
            self.set_cookie("purview_user", resp.result["page_optaretor"])
            if resp.result["urls"]:
                uris = resp.result["urls"]
            else:
                uris = []
            AuthHandle.init_handle_authority(uris)
            self.render("dashboard.html")
        elif userinfo == 1:
            self.render("login.html", login_info="password_error")
        elif userinfo == 2:
            self.render("login.html", login_info="user_error")
        else:
            self.render("login.html", login_info="none")

    def get(self, *args, **kwargs):
        self.render("login.html", login_info="none")


class GetUserDomainHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        resp = yield tornado.gen.Task(task.get_domain_users_task.apply_async, args=[])
        userinfo = resp.result
        resp_json = json.dumps(userinfo)
        self.write(resp_json)


class AddUserHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        add_user_group = self.get_argument("add_user_group")
        add_user_name = self.get_argument("add_user_name")
        add_password = self.get_argument("add_password")
        add_user_description = self.get_argument("add_user_description")
        add_telephone = self.get_argument("add_telephone")
        add_email = self.get_argument("add_email")
        usercfg = {'user_group': str(add_user_group), 'user_name': str(add_user_name),
                       'password': str(add_password), 'user_description': str(add_user_description),
                       'telephone': str(add_telephone), 'email': str(add_email)}
        resp = yield tornado.gen.Task(task.add_user_cfg_task.apply_async, args=[usercfg])
        self.render("management-user.html", add_back_userinfo=resp.result)

    def get(self, *args, **kwargs):
        self.render("management-user.html", add_back_userinfo="ok")


class GetGroupUserInfoHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        domain_name=str(self.get_cookie("Lgdomain"))
        resp = yield tornado.gen.Task(task.get_group_users_task.apply_async, args=[domain_name])
        userinfo = resp.result
        resp_json = json.dumps(userinfo)
        self.write(resp_json)


class GetUserGroupIdHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        current=str(self.get_cookie("username"))
        domain_name=str(self.get_cookie("Lgdomain"))
        resp = yield tornado.gen.Task(task.get_current_user_groupId_task.apply_async, args=[current,domain_name])
        userinfo = resp.result
        resp_json = json.dumps(userinfo)
        self.write(resp_json)


class EditPasswordUserHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        edit_user_name_id = self.get_argument("user_name_id")
        edit_user_group = self.get_argument("user_group_name")
        edit_user_name = self.get_argument("user_name")
        edit_old_password = self.get_argument("old_password")
        edit_password = self.get_argument("password")
        current=str(self.get_cookie("username"))
        usercfg = {'edit_user_name_id': edit_user_name_id, 'edit_user_group': edit_user_group,
                   'edit_user_name': edit_user_name, 'edit_password': edit_password,
                   'edit_old_password': edit_old_password}
        resp = yield tornado.gen.Task(task.edit_password_user_cfg_task.apply_async, args=[usercfg])
        if edit_user_name==current and resp.result is True:
            self.render("logout.html")
        else:
            self.render("management-userconfig.html", add_back_userinfo=resp.result)

    def get(self, *args, **kwargs):
        self.render("management-userconfig.html", add_back_userinfo="ok")


class EditInfoUserHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        edit_user_name_id = self.get_argument("user_name_id")
        edit_user_description = self.get_argument("user_description")
        edit_telephone = self.get_argument("telephone")
        edit_email = self.get_argument("email")
        usercfg = {'edit_user_name_id': edit_user_name_id,  'edit_user_description': edit_user_description,
                   'edit_telephone': edit_telephone, 'edit_email': edit_email}
        resp = yield tornado.gen.Task(task.edit_userinfo_cfg_task.apply_async, args=[usercfg])

        self.render("management-userconfig.html", add_back_userinfo=resp.result)

    def get(self, *args, **kwargs):
        self.render("management-userconfig.html", add_back_userinfo="ok")


class DeleteUserHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        delete_user_name_id = self.get_argument("delete_user_name_id")
        delete_user_name = self.get_argument("delete_user_name")
        current=str(self.get_cookie("username"))
        resp = yield tornado.gen.Task(task.delete_user_task.apply_async, args=[delete_user_name_id])
        if delete_user_name==current:
            self.render("logout.html")
        else:
            self.render("management-user.html", add_back_userinfo="ok")