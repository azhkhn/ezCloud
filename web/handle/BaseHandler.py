__author__ = 'wangtao'

import web.handle.session
import tornado.web
import functools
from common.log import *
try:
    import urlparse  # py2
except ImportError:
    import urllib.parse as urlparse  # py3

try:
    from urllib import urlencode  # py2
except ImportError:
    from urllib.parse import urlencode  # py3

LOGIN_TIMEOUT = 5*60


class BaseHandler(tornado.web.RequestHandler):
    def initialize(self):
        redis = self.application.redis
        self.session = self.application.SessionHandler(self, redis, session_lifetime=LOGIN_TIMEOUT)
        self.current_password = self.session.password

    def get_current_user(self):
        return self.get_cookie("username")

    @staticmethod
    def btype_to_str(btype):
        string = str(btype)
        if len(string) != 0:
            return string[2:-1]
        else:
            return None

    def auth(method):
        @functools.wraps(method)
        def wrapper(self, *args, **kwargs):
            if self.current_user:
                user = self.btype_to_str(self.current_user)
                log.logger.debug("current_user: {0}".format(user))
            if self.current_password:
                password = self.btype_to_str(self.current_password)
                log.logger.debug("current_password: {0}".format(password))
            if self.request.method in ("GET", "HEAD", "POST"):
                if self.current_user and self.current_password:
                    log.logger.debug("authorized")
                    self.session.update_session_expire()
                    return method(self, *args, **kwargs)
                if self.current_user and not self.current_password:
                    log.logger.debug("session timeout")
                    self.render("login.html", login_info="ok")
                    return
                else:
                    log.logger.debug("unauthorized")
                    self.render("login.html", login_info="ok")
                    return
            else:
                raise tornado.web.HTTPError(403)
        return wrapper