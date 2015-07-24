__author__ = 'wangtao'

import getopt
import sys
sys.path.append("..")
from common.log import *


def usage():
    print('debug.py usage:')
    print("         -h, --help: print help message.")
    print("         -l, --log_level [debug | info | warn | error]: set the log level")


def set_log_level(level):
    print("set log level: {0}".format(level))
    if level == "debug":
        log.set_log_level("DEBUG")
    elif level == "info":
        log.set_log_level("INFO")
    elif level == "warn":
        log.set_log_level("WARNING")
    elif level == "error":
        log.set_log_level("ERROR")
    else:
        print("unknown log level!")


def main(argv):
    flag = 0
    if len(argv) == 1:
        usage()
    try:
        opts, args = getopt.getopt(argv[1:], 'hl:')
    except:
        usage()
        sys.exit(2)
    for opt, arg in opts:
        flag += 1
        if opt in ('-h', '--help'):
            usage()
            sys.exit(1)
        elif opt in ('-l', '--log_level'):
            set_log_level(arg)
            sys.exit(0)
        else:
            usage()
            sys.exit(3)
    if not flag:
        usage()

if __name__ == "__main__":
    main(sys.argv)
