__author__ = 'wangtao'

import datetime
import time
import os
from apscheduler.schedulers.background import BackgroundScheduler
from signal import signal, SIGTERM
import sys
sys.path.append("..")
from common.log import *
from common.util import *


class PMScheduleWork(object):
    def __init__(self):
        self._db = None
        self.each_flush = 30
        self.interval = 5*60

    @with_db_connection
    def pm_clean_job(self):
        log.logger.debug("+++++device pm clean job+++++")
        devs = self._db.query("Device_Config_Basic", {"monitored": 1}, fields=["id", "timezone"])
        if devs:
            for dev in devs:
                dev_id = int(dev['id'])
                timezone = int(dev['timezone'])
                pm_radio = self._db.query("Device_Pm_Radio", {'dev_id': dev_id}, fields=["report_time"])
                if pm_radio:
                    sys_time = get_systime_int(timezone)
                    for u in pm_radio:
                        st = str(u['report_time'])
                        tm = datetime.datetime.strptime(st, "%Y-%m-%d %H:%M:%S")
                        dt = int(time.mktime(tm.timetuple()))*1000
                        now = int(sys_time)*1000
                        if int(now - dt) > 6*60*1000 or (dt > now):
                            self._db.delete("Device_Pm_Radio", {'report_time': u['report_time']})

if __name__ == '__main__':
    pm_work = PMScheduleWork()
    db = init_db()
    if db:
        pm_work._db = db
    else:
        log.logger.error("start pm clean work failed!")
        exit(1)
    log.logger.info("start pm clean work successful!")
    signal(SIGTERM, lambda signum, stack_frame: exit(1))
    scheduler = BackgroundScheduler()
    try:
        dev_pm_clean_job = scheduler.add_job(pm_work.pm_clean_job, 'interval', max_instances=2,
                                             seconds=pm_work.interval)
    except:
        log.logger.error("add device pm_clean_job failed!")
    scheduler.start()

    try:
        # This is here to simulate application activity (which keeps the main thread alive).
        while True:
            time.sleep(3)
    except (KeyboardInterrupt, SystemExit):
        log.logger.info("shutdown pm clean schedule work")
        scheduler.shutdown()  # Not strictly necessary if daemonic mode is enabled but should be done if possible