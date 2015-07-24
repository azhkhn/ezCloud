__author__ = 'wangtao'

import logging
import os.path
import sys
sys.path.append("..")


from common.util import *


@with_connection
def test_db(mydb):
    device_all_cfgs = mydb.query_all("Device_Config_Basic")
    print("{0}".format(device_all_cfgs))
    device_cfgs = mydb.query("Device_Config_Basic", {'id': 1})
    print("{0}".format(device_cfgs))
    dev_basic_cfg = mydb.query_one("Device_Config_Basic", {'id': 1})
    print("{0}".format(dev_basic_cfg))
    dev_basic_cfg1 = mydb.query_records_num("Device_Config_Basic", {'id': 1})
    print("{0}".format(dev_basic_cfg1))

if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    mydb = connect_db()
    test_db(mydb)
