__author__ = 'wangtao'

from tornado import gen
from tornado.ioloop import IOLoop
from tornado.options import define,options
import tornado.websocket
from tornado.websocket import websocket_connect
import json

import time

define('url', default='ws://localhost:9000/')

@gen.engine
def sendmsg():
    url = options.url
    try:
        wssconn = yield websocket_connect(url, None)
        while True:
            rcvmsg = yield wssconn.read_message()
            if rcvmsg is None:
                rcvmsg = {"msgType":"message is none"}
                continue
            else:
                print("recv message:{0}".format(rcvmsg))
            try:
                rcvmsgDict = json.loads(rcvmsg)
                msgType = rcvmsgDict["msg_type"]
                if msgType == 2:
                    if rcvmsgDict["value"] == "1":
                        print("AP register to ac successful!!!")
                    else:
                        print("AP register to ac fail, sleep 3s and try again!!!")
                        time.sleep(3)
                        message = {"apsn": "cig555555", "sw_ver": "R2.0.02.010",
                           "sw_ver_bak" : "R2.0.02.010", "boot_ver": "V2.1.1", "firmware": "V1.0", "hw_ver": "80010101",
                           "apip": "10.5.5.223", "msg_type": 1, "apmac": "00:19:cb:56:78:09",
                           "vendor": "cig", "wan_speed": "1000", "wan_duplex": "1",
                           "wan_port_vid": "100", "data_sync": "0"}
                        respJson = json.dumps(message)
                        wssconn.write_message(respJson)
                elif msgType == 4:
                    if rcvmsgDict["value"] == "ack":
                        print("heartbeat ack msg")
                    else:
                        print("unknown heartbeat msg")
                elif msgType == "cfg_changed":
                    print("cfg change msg")
                else:
                    print("unknown message type!")
            except:
                print("unknown message type!")
                message = {"apsn": "cig555555", "sw_ver": "R2.0.02.010",
                           "sw_ver_bak" : "R2.0.02.010", "boot_ver": "V2.1.1", "firmware": "V1.0", "hw_ver": "80010101",
                           "apip": "10.5.5.223", "msg_type": 1, "apmac": "00:19:cb:56:78:09",
                           "vendor": "cig", "wan_speed": "1000", "wan_duplex": "1",
                           "wan_port_vid": "100", "data_sync": "0"}
                respJson = json.dumps(message)
                wssconn.write_message(respJson)
    except:
        print("websocket_connect fail!!!")
    IOLoop.instance().stop()

if __name__ == "__main__":
    IOLoop.instance().add_callback(sendmsg)
    IOLoop.instance().start()
    #sendmsg()


