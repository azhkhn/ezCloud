__author__ = 'wangtao'

import tornado.web
import tornado.websocket


class BaseHandler(tornado.websocket.WebSocketHandler):
    @property
    def db(self):
        return self.application.db

    @property
    def redis(self):
        return self.application.redis

