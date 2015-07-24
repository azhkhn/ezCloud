__author__ = 'wangtao'

import sys
import redis
from database.db_mysql_connector import *
from database import db
from database.db import *
from common.log import *
import time
import os
import socket
import fcntl
import struct
import ctypes

CTOOL_LIB_PATH = "/opt/wms/ezCloud/tools/libctool.so"
SYSTEM_ETH_NAME = "eno16777736"
TMP_IMPORT_CFG_PATH = "/tmp/upload/"
TMP_EXPORT_CFG_PATH = "/tmp/download/"
FIRMWARE_FILE_PATH = "/opt/wms/firmware"
SYS_CFG_FILE = "sys_config.sql"
ENCRYPT_SYS_CFG_FILE = "sys_config.encrypt"
DATABASE = "cigwmsdb"
DATABASE_CFG = "config/db.cfg"
REDIS_CFG = "config/redis.cfg"
MYSQL_DUMP = "/opt/wms/mysql/bin/mysqldump"
MYSQL = "/opt/wms/mysql/bin/mysql"
FIELS_PATH = "/opt/wms/ezCloud/web/files"
WSS_START_SH = "/opt/wms/ezCloud/start_wss_server"

"""
===============common function===============
"""
def connectDB():
    cfg_path = os.path.join(os.path.dirname(__file__), os.pardir, DATABASE_CFG)
    config = parse_config_file(cfg_path)
    db = MysqlConnDb()
    if config and db.connect(**config):
        log.logger.debug("connect to database success!")
        return db
    else:
        log.logger.error("connect to database fail!")
        return None


def closeDB(db):
    log.logger.debug("close database")
    db.close()


def init_db():
    cfg_path = os.path.join(os.path.dirname(__file__), os.pardir, DATABASE_CFG)
    config = parse_config_file(cfg_path)
    db.init('mysql', **config)
    return db


def use_db(func):
    @functools.wraps(func)
    def _wrapper(*args, **kw):
        init_db()
        with connection():
            return func(*args, **kw)
    return _wrapper

def parse_config_file(path):
    config = []
    f = open(path)
    config = {}
    try:
        while True:
            line = f.readline()
            if not line:
                break
            line_list = line.split("=")
            if len(line_list) > 1:
                key = line_list[0]
                value = line_list[1].strip('\n')
                line_dict = {key: value}
                config.update(line_dict)
        log.logger.debug("parse config: {0}".format(config))
        if len(config) == 0:
            return None
        else:
            return config
    except:
        log.logger.error("get system info failed!")
        return None
    f.close()


def get_sys_time(sys_timezone):
    cmd = "date +%z"
    res = os.popen(cmd).read()
    os_timezone = int(res)/100
    tz_diff = int(sys_timezone)-os_timezone
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(time.time()+(tz_diff*3600)))


def get_systime_int(sys_timezone):
    cmd = "date +%z"
    res = os.popen(cmd).read()
    os_timezone = int(res)/100
    tz_diff = int(sys_timezone)-os_timezone
    return time.time()+(tz_diff*3600)


def redis_string_convert(redis_str):
    string = str(redis_str)
    if len(string) != 0:
        return string[2:-1]
    else:
        return None


def connect_redis():
    cfg_path = os.path.join(os.path.dirname(__file__), os.pardir, REDIS_CFG)
    config = parse_config_file(cfg_path)
    redis_ret = redis.Redis(host=config['host'], port=config['port'])
    if redis_ret:
        log.logger.info("connect to redis success!")
        return redis_ret
    else:
        log.logger.error("connect to redis fail!")
        return None


def _read_cpu_usage():
    """Read the current system cpu usage from /proc/stat."""
    try:
        fd = open("/proc/stat", 'r')
        lines = fd.readlines()
    finally:
         if fd:
             fd.close()
    for line in lines:
        l = line.split()
        if len(l) < 5:
            continue
        if l[0].startswith('cpu'):
            return l
    return {}


def get_cpu_usage():
    """
    get cpu avg used by percent
    """
    cpustr=_read_cpu_usage()
    if not cpustr:
        return 0
    usni1=int( cpustr[1])+int(cpustr[2])+int(cpustr[3])+int(cpustr[5])+int(cpustr[6])+int(cpustr[7])+int(cpustr[4] )
    usn1=int( cpustr[1])+int(cpustr[2])+int(cpustr[3])
    time.sleep(2)
    cpustr=_read_cpu_usage()
    if not cpustr:
        return 0
    usni2=int(cpustr[1])+int(cpustr[2])+float(cpustr[3])+int(cpustr[5])+int(cpustr[6])+int(cpustr[7])+int(cpustr[4])
    usn2=int(cpustr[1])+int(cpustr[2])+int(cpustr[3])
    cpuper=(usn2-usn1)/(usni2-usni1)
    return 100*cpuper


def memory_stat():
    mem = {}
    f = open("/proc/meminfo")
    lines = f.readlines()
    f.close()
    for line in lines:
        if len(line) < 2: continue
        name = line.split(':')[0]
        var = line.split(':')[1].split()[0]
        mem[name] = int(var)
    mem['MemUsed'] = mem['MemTotal'] - mem['MemFree'] - mem['Buffers'] - mem['Cached']
    return mem


def get_sys_ip():
    eth_name = SYSTEM_ETH_NAME
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    eth_name = eth_name.encode('utf-8')
    sys_ip = socket.inet_ntoa(fcntl.ioctl(s.fileno(), 0X8915, struct.pack('256s', eth_name[:15]))[20:24])
    log.logger.info("get sys ip:{0}".format(sys_ip))
    return sys_ip


def encrypt_sys_config(file):
    ll = ctypes.cdll.LoadLibrary
    lib = ll(CTOOL_LIB_PATH)
    file_c = ctypes.create_string_buffer(len(file))
    file_c.value = file.encode(encoding="utf-8")
    ret = lib.Encrypt_config_file(file_c)
    if ret:
        log.logger.debug("encrypt file '{0}' successful!".format(file))
        return True
    else:
        log.logger.debug("encrypt file '{0}' failed!".format(file))
        return False


def unencrypt_sys_config(file):
    ll = ctypes.cdll.LoadLibrary
    lib = ll(CTOOL_LIB_PATH)
    file_c = ctypes.create_string_buffer(len(file))
    file_c.value = file.encode(encoding="utf-8")
    ret = lib.Unencrypt_config_file(file_c)
    if ret == 1:
        log.logger.debug("unencrypt file '{0}' successful!".format(file))
        return True
    else:
        log.logger.debug("unencrypt file '{0}' failed!".format(file))
        return False


def check_image_file(file):
    ll = ctypes.cdll.LoadLibrary
    lib = ll(CTOOL_LIB_PATH)
    length = len(file)
    length_c = ctypes.c_int(length)
    file_c = ctypes.create_string_buffer(length)
    file_c.value = file.encode(encoding="utf-8")
    ret = lib.CheckFileImage(file_c, length_c)
    if ret == 1:
        log.logger.debug("check image successful!")
        return True
    else:
        log.logger.debug("check image failed!")
        return False


def check_image_version(file, version):
    ll = ctypes.cdll.LoadLibrary
    lib = ll(CTOOL_LIB_PATH)
    length = len(file)
    length_c = ctypes.c_int(length)
    file_c = ctypes.create_string_buffer(length)
    version_c = ctypes.create_string_buffer(len(version))
    file_c.value = file.encode(encoding="utf-8")
    version_c.value = version.encode(encoding="utf-8")
    ret = lib.CheckImgSWVersion(file_c, length_c, version_c)
    if ret == 1:
        log.logger.debug("check image version successful!")
        return True
    else:
        log.logger.debug("check image version failed!")
        return False



def read_disk_info():
    fi=os.popen("df -hl")
    temp=''
    while True :
        line=fi.readline()
        if line.find('sdb1')>0:
            temp=line
            break
        elif len(line)==0:
            break
    fi.close()
    return  temp