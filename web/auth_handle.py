__author__ = 'wangtao'
from common.log import *


class AuthHandle(object):
    _handlers = []

    def __init__(self, handlers):
        for pattern, handler in handlers:
            try:
                if handler.post_allowed:
                    self._handlers.append((pattern, handler))
            except:
                continue

    @staticmethod
    def get_handlers():
        return AuthHandle._handlers

    @staticmethod
    def init_handle_authority(uris):
        if not isinstance(uris, (list, dict)):
            log.logger.error("the type of uris must be list or dict")
            return
        if len(uris) == 0:
            return
        for pattern, handler in AuthHandle._handlers:
            try:
                for uri in uris:
                    try:
                        if uri[pattern] == 0:
                            handler.post_allowed = False
                        else:
                            handler.post_allowed = True
                        break
                    except:
                        continue
            except:
                continue
