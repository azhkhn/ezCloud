__author__ = 'wangtao'

import tornado.web
import tornado.ioloop
import tornado.websocket
from tornado.options import define, options,parse_command_line
import os.path
import sys
sys.path.append("..")
import redis
# wss_accom import ACSideCommHandler
from wss.wss_apcom import APSideCommHandler
from common.log import *
from common.util import *
import atexit
from signal import signal, SIGTERM
# from wss.wss_msg import Message

define("port", default=9000, help="run on the given port", type=int)


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            # (r"/acwss", ACSideCommHandler),
            (r"/", APSideCommHandler),
        ]
        settings = dict(
            xsrf_cookies=True,
        )
        self.redis = None
        self.db = None
        tornado.web.Application.__init__(self, handlers, **settings)


def main():
    app = Application()
    signal(SIGTERM, lambda signum, stack_frame: exit(1))
    app.db = init_db()
    if app.db is None:
        log.logger.error("start web socket server fail!!!")
        return
    APSideCommHandler.ac_msg_init(APSideCommHandler, app.db)
    app.redis = connect_redis()
    if app.redis is None:
        log.logger.error("start web socket server fail!!!")
    atexit.register(exit_wss, app.redis)
    tornado.options.parse_command_line()
    app.listen(options.port)
    log.logger.info("start web socket server on port[{0}] success!".format(options.port))
    tornado.ioloop.IOLoop.instance().start()


def exit_wss(redis):
    db = connectDB()
    log.logger.info("exit web socket server process!!!")
    if db:
        ret = db.update("Device_Status_Basic", {"dev_state": 0}, None)
        if ret is False:
            log.logger.error("set all device status to off-line failed!")
        else:
            log.logger.info("set all device status to off-line success!")
        db.update("System_Config_Network", {"up_ok": 0}, None)
        closeDB(db)
        APSideCommHandler.msg.db = None
    else:
        log.logger.error("db is null")
    if redis:
        redis.flushdb()
    else:
        log.logger.error("redis is null")
    APSideCommHandler.executor.shutdown()

if __name__ == "__main__":
    main()
