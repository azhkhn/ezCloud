__author__ = 'wangtao'

from hashlib import sha1
import os,time
from common.log import *
from common.util import *

# session_id = lambda: sha1('%s%s' % (os.urandom(16), time.time())).hexdigest()


class SessionHandler(object):
    _id = None
    _prefix = "_session:"
    _skip = ["_redis", "_request", "_id", "lastActive", "_prefix", "session_lifetime"]

    def __init__(self, request, redis, session_lifetime=60 * 60 * 24):
        self._request = request
        self._redis = redis
        self.session_lifetime = session_lifetime
        self.init_session()

    @staticmethod
    def session_id():
        data = str(os.urandom(16)) + str(time.time())
        seesion_id = sha1(data.encode(encoding="utf-8")).hexdigest()
        return seesion_id

    def update_session_expire(self):
        self._id = redis_string_convert(self._id)
        log.logger.debug("update session:{0} expire time: {1}".format(self._id, self.session_lifetime))
        self._redis.expire(self._id, self.session_lifetime)

    def init_session(self):
        _id = self._request.get_secure_cookie("session_id")
        if not _id:
            _id = self.session_id()
        else:
            if not self._redis.exists(_id):
                _id = self.session_id()
        log.logger.debug("set session cookies: {0}".format(_id))
        self._request.set_secure_cookie("session_id", _id)
        self._id = _id

    def __getattr__(self, name):
        if name in self._skip:
            return object.__getattr__(self, name)
        else:
            log.logger.debug("Redis hget key: {0}, filed: {1}, value: {2}".format(self._id, name, self._redis.hget(self._id, name)))
            return self._redis.hget(self._id, name)

    def __setattr__(self, name, value):
        if name in self._skip:
            object.__setattr__(self, name, value)
        else:
            self.init_session()
            log.logger.debug("Redis hset key: {0}, filed: {1}, value: {2}, expire: {3}".
                             format(self._id, name, value, self.session_lifetime))
            self._redis.hset(self._id, name, value)
            self._redis.expire(self._id, self.session_lifetime)

    def __delattr__(self, name):
        if name in self._skip:
            object.__delattr__(self, name)
        else:
            return self._redis.hdel(self._id, name)

