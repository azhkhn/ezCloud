__author__ = 'wangtao'

import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.gen
import os.path
import json
import tcelery
import sys
sys.path.append("..")
from common.log import *
from common.util import *
from settings import SETTINGS
from urls import URLS
from web.handle.session import SessionHandler
from web.auth_handle import *

from tornado.options import define, options, parse_command_line
define("port", default=8000, help="run on the given port", type=int)

tcelery.setup_nonblocking_producer()


class Application(tornado.web.Application):
    def __init__(self):
        handlers = URLS
        settings = SETTINGS
        self.redis = None
        tornado.web.Application.__init__(self, handlers, **settings)

application = Application()


def main():
    parse_command_line()
    app = Application()
    auth_handle = AuthHandle(URLS)
    app.redis = connect_redis()
    if app.redis:
        app.SessionHandler = SessionHandler
        app.listen(options.port)
        log.logger.info("start web service server success!")
        tornado.ioloop.IOLoop.instance().start()
    else:
        log.logger.error("start web service server fail!!!")


if __name__ == "__main__":
    main()
