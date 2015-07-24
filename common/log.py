__author__ = 'wangtao'

"""Logging support for eZCloud.
"""

import logging
import logging.handlers
from logging.handlers import RotatingFileHandler

LOG_FILE = "/tmp/wms.log"
FILE_SIZE = 10*1024*1024


class Log(object):
    def __init__(self):

        self.logger = logging.getLogger('ezCloud')
        self.logger.setLevel(logging.INFO)
        logging.basicConfig(format='[%(asctime)s,%(lineno)d %(levelname)s/%(filename)s] %(message)s',
                            datefmt='%Y-%m-%d %H:%M:%S')
        formatter = logging.Formatter('[%(asctime)s,%(lineno)d %(levelname)s/%(filename)s] %(message)s')
        #console = logging.StreamHandler()
        #console.setLevel(logging.DEBUG)
        #console.setFormatter(formatter)
        #self.logger.addHandler(console)

        file_io = RotatingFileHandler(LOG_FILE, maxBytes=FILE_SIZE, backupCount=3)
        file_io.setLevel(logging.INFO)
        file_io.setFormatter(formatter)
        self.logger.addHandler(file_io)

    def set_log_level(self, level):
        if level == "NOTSET":
            self.logger.setLevel(logging.NOTSET)
        if level == "DEBUG":
            self.logger.setLevel(logging.DEBUG)
        elif level == "INFO":
            self.logger.setLevel(logging.INFO)
        elif level == "WARNING":
            self.logger.setLevel(logging.WARNING)
        elif level == "ERROR":
            self.logger.setLevel(logging.ERROR)
        elif level == "CRITICAL":
            self.logger.setLevel(logging.CRITICAL)
        else:
            print("[LOG]Unknown log level")

log = Log()




