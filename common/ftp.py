import ftplib
import os
import socket
from common.log import *

CMD_BUF_SIZE = 8192
TIME_OUT = 60


def ftp_put(host, user, passwd, path, filename):
    socket.setdefaulttimeout(TIME_OUT)
    try:
        ftp = ftplib.FTP(host)
    except:
        log.logger.error("ERROR:cannot reach {0}".format(host))
        return False
    log.logger.debug("***connected to host {0}".format(host))

    try:
        if len(user) != 0 and len(passwd) != 0:
            ftp.login(user, passwd)
        elif len(user) != 0 and len(passwd) == 0:
            ftp.login(user)
        else:
            ftp.login()
    except ftplib.error_perm:
        log.logger.error("ERROR:cannot login to host {0}".format(host))
        ftp.quit()
        return False

    try:
        command = 'STOR ' + filename
        file = os.path.join(path, filename)
        filehandler = open(file, 'rb')
        ftp.storbinary(command, filehandler, CMD_BUF_SIZE)
        filehandler.close()
    except ftplib.error_perm:
        log.logger.error("ERROR:cannot put file '{0}'".format(file))
        ftp.quit()
        return False

    log.logger.debug("put file '{0}' successful".format(file))
    return True


def ftp_del(host, user, passwd, filename):
    try:
        ftp = ftplib.FTP(host)
    except:
        log.logger.error("ERROR:cannot reach {0}".format(host))
        return False
    log.logger.debug("***connected to host {0}".format(host))

    try:
        if len(user) != 0 and len(passwd) != 0:
            ftp.login(user, passwd)
        elif len(user) != 0 and len(passwd) == 0:
            ftp.login(user)
        else:
            ftp.login()
    except ftplib.error_perm:
        log.logger.error("ERROR:cannot login to host {0}".format(host))
        ftp.quit()
        return False

    try:
        ftp.delete(filename)
    except:
        log.logger.error("ERROR:cannot delete file '{0}'".format(filename))
        ftp.quit()
        return False

    log.logger.debug("delete file '{0}' successful".format(filename))
    return True
