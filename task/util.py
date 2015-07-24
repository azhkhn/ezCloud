__author__ = 'wangtao'

from celery import Celery
from tornado import gen
from tornado.ioloop import IOLoop
from tornado.options import define,options
import tornado.websocket
import time,datetime
from tornado.websocket import websocket_connect
import sys
from common.log import *
from common.util import *
from common.ftp import *
import json
import os


# backend = 'redis://127.0.0.1:6379/0'
# broker = 'redis://127.0.0.1:6379/1'
backend = 'amqp'
broker = 'amqp://'

app = Celery('task', backend=backend, broker=broker)
app.conf.update(
    CELERY_TASK_SERIALIZER='json',
    CELERY_ACCEPT_CONTENT=['json'],
    CELERY_RESULT_SERIALIZER='json',
    )

define('url', default='ws://localhost:9000')


def notify_cfg_changed(msg_type, param=None):
    if param:
        message = {"msg_type": msg_type, "value": param}
    else:
        message = {"msg_type": msg_type, "value": "none"}
    IOLoop.instance().add_callback(sendmsg, message)
    IOLoop.instance().start()


def append_network_data(data_list, db):
    networks = db.query_all("System_Config_Network")
    if networks:
        for network in networks:
            network_dict = {}
            network_dict['data_type'] = "network"
            network_dict['network_id'] = network['id']
            network_dict['network_name'] = network['network_name']
            data_list.append(network_dict)
    return data_list


def append_ssid_list_data(data_list, db, network):
    network_cfg = db.query_one("System_Config_Network", {'network_name': network})
    if network_cfg:
        ssid_tp_cfgs = db.query("Device_Config_SsidTemplate", {'network_id': network_cfg['id']})
        if ssid_tp_cfgs:
            for ssid_tp_cfg in ssid_tp_cfgs:
                ssid_name_dict = {}
                ssid_name_dict['data_type'] = "ssid_list"
                ssid_name_dict['ssid_name'] = ssid_tp_cfg['ssid_name']
                ssid_name_dict['ssid_id'] = ssid_tp_cfg['id']
                data_list.append(ssid_name_dict)
    return data_list


def append_dev_list_data(data_list, db, network):
    network_cfg = db.query_one("System_Config_Network", {'network_name': network})
    if network_cfg:
        dev_list = db.query("Device_Config_Basic", {'network_id': network_cfg['id']})
        if dev_list:
            for dev_cfg in dev_list:
                dev_dict = {}
                dev_dict['data_type'] = "dev_list"
                dev_dict['dev_name'] = dev_cfg['dev_name']
                dev_dict['dev_id'] = dev_cfg['id']
                data_list.append(dev_dict)
    return data_list


@gen.engine
def sendmsg(message):
    url = options.url
    try:
        wssconn = yield websocket_connect(url)
        respJson = json.dumps(message)
        wssconn.write_message(respJson)
        wssconn.close()
    except:
        log.logger.error("websocket_connect fail!!!")
    IOLoop.instance().stop()
