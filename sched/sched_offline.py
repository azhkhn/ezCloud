import datetime
import time
import os
from apscheduler.schedulers.background import BackgroundScheduler
from signal import signal, SIGTERM
import sys
sys.path.append("..")
from common.log import *
from common.util import *


class OfflineCheckScheduleWork(object):
    def __init__(self):
        self._db = None
        self._redis = None
        self.total_dev = 0
        self.start_dev = 1
        self.end_dev = 1
        self.each_flush = 50
        self.interval = 15

    @with_db_connection
    def get_total_dev_total_num(self):
        self.total_dev = self._db.query_records_num("Device_Status_Basic", None)
        log.logger.debug("total_dev: {0}".format(self.total_dev))
        if self.total_dev:
            return self.total_dev
        else:
            return 0

    @with_db_connection
    def ageing_job(self):
        log.logger.debug("+++++device status ageing job+++++")
        if self.get_total_dev_total_num() == 0:
            return
        left = self.total_dev + 1 - self.end_dev
        if left <= 0:
            self.start_dev = 1
            self.end_dev = 1
            left = self.total_dev
    
        if left < self.each_flush:
            self.end_dev = self.total_dev + 1
        else:
            self.end_dev = self.start_dev + self.each_flush
        for index in range(self.start_dev, self.end_dev):
            fields = ["id", "dev_state", "dev_id"]
            dev_info = self._db.query("Device_Status_Basic", None, fields=fields, start=index, offset=1)
            if dev_info:
                dev_id = int(dev_info[0]['dev_id'])
                dev_state = dev_info[0]['dev_state']
                if dev_state and not self._redis.exists(dev_id):
                    log.logger.info("ageing out, device[{0}] is offline!!!".format(dev_id))
                    self._db.update("Device_Status_Basic", {"dev_state": 0}, {"dev_id": dev_id})
                    # set device offline alarm
                    dev_config = self._db.query_one("Device_Config_Basic", {"id": dev_id}, fields=["timezone"])
                    if dev_config:
                        date_time = get_sys_time(dev_config['timezone'])
                        self._db.insert("Device_Alarm", {'dev_id': dev_id, 'dev_alm_action': "set",
                                                         'dev_alm_function': "offline",
                                                         'dev_alm_time': date_time})
        self.start_dev = self.end_dev

if __name__ == '__main__':
    dev_work = OfflineCheckScheduleWork()
    db = init_db()
    if db:
        dev_work._db = db
    else:
        log.logger.error("start offline check work failed!")
        exit(1)
    redis = connect_redis()
    if redis:
        dev_work._redis = redis
    else:
        log.logger.error("start offline check work failed!")
        exit(1)

    log.logger.info("start offline check work successful!")
    signal(SIGTERM, lambda signum, stack_frame: exit(1))
    scheduler = BackgroundScheduler()
    try:
        dev_ageing_job = scheduler.add_job(dev_work.ageing_job, 'interval', seconds=dev_work.interval)
    except:
        log.logger.error("add device ageing_job failed!")
    scheduler.start()

    try:
        # This is here to simulate application activity (which keeps the main thread alive).
        while True:
            time.sleep(3)
    except (KeyboardInterrupt, SystemExit):
        log.logger.info("shutdown offline check schedule work")
        scheduler.shutdown()  # Not strictly necessary if daemonic mode is enabled but should be done if possible
