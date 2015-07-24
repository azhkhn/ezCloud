#!/usr/bin/env python
# -*- coding:UTF-8 -*-

__author__ = 'avygong'
__date__ = '15-1-10'
__time__ = '9:16'
__description__ = 'settings'
import os

SETTINGS = {
    "template_path": os.path.join(os.path.dirname(__file__), "templates"),
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    "cookie_secret": "61oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo=",
    "login_url": "/login.html",
    "xsrf_cookies": False,
    "debug": True
}