#!/usr/bin/env python
# -*- coding: utf-8 -*-

__author__ = 'wangtao'

'''
Database operation module. This module is independent with web module.
'''

import os
import re
import sys
import time
import uuid
import datetime
import functools
import threading
import logging
import collections
import mysql.connector

from common.utils import Dict
from common.log import log


def next_str(t=None):
    """
    Return next id as 50-char string.

    Args:
        t: unix timestamp, default to None and using time.time().
    """
    if t is None:
        t = time.time()
    return '%015d%s000' % (int(t * 1000), uuid.uuid4().hex)

next_id = next_str


def _profiling(start, sql=''):
    t = time.time() - start
    if t > 0.1:
        log.logger.warning('[PROFILING] [DB] %s: %s' % (t, sql))
    else:
        log.logger.debug('[PROFILING] [DB] %s: %s' % (t, sql))


class DBError(Exception):
    pass


class MultiColumnsError(DBError):
    pass


def _dummy_connect():
    """
    Connect function used for get db connection. This function will be relocated in init(dbn, ...).
    """
    raise DBError('Database is not initialized. call init(dbn, ...) first.')


_db_connect = _dummy_connect
_db_convert = '?'


class _LasyConnection(object):

    def __init__(self):
        self.connection = None

    def cursor(self):
        if self.connection is None:
            log.logger.info('***********open connection***********')
            self.connection = _db_connect()
        return self.connection.cursor()

    def commit(self):
        self.connection.commit()

    def rollback(self):
        self.connection.rollback()

    def cleanup(self):
        if self.connection:
            connection = self.connection
            self.connection = None
            log.logger.info('***********close connection**********')
            connection.close()


class _DbCtx(threading.local):
    """
    Thread local object that holds connection info.
    """
    def __init__(self):
        self.connection = None
        self.transactions = 0

    def is_init(self):
        if self.connection is None:
            return False
        else:
            return True

    def init(self):
        log.logger.debug('open lazy connection...')
        self.connection = _LasyConnection()
        self.transactions = 0

    def cleanup(self):
        self.connection.cleanup()

    def cursor(self):
        """
        Return cursor
        """
        return self.connection.cursor()

_db_ctx = _DbCtx()


class _ConnectionCtx(object):
    """
    _ConnectionCtx object that can open and close connection context. _ConnectionCtx object can be nested and only the most 
    outer connection has effect.

    with connection():
        pass
        with connection():
            pass
    """
    def __enter__(self):
        global _db_ctx
        self.should_cleanup = False
        if not _db_ctx.is_init():
            _db_ctx.init()
            self.should_cleanup = True
        return self

    def __exit__(self, exctype, excvalue, traceback):
        global _db_ctx
        if self.should_cleanup:
            _db_ctx.cleanup()


def connection():
    """
    Return _ConnectionCtx object that can be used by 'with' statement:

    with connection():
        pass
    """
    return _ConnectionCtx()


def with_db_connection(func):
    """
    Decorator for reuse connection.

    @with_db_connection
    def foo(*args, **kw):
        f1()
        f2()
        f3()
    """
    @functools.wraps(func)
    def _wrapper(*args, **kw):
        with _ConnectionCtx():
            return func(*args, **kw)
    return _wrapper


class _TransactionCtx(object):
    """
    _TransactionCtx object that can handle transactions.

    with _TransactionCtx():
        pass
    """

    def __enter__(self):
        global _db_ctx
        self.should_close_conn = False
        if not _db_ctx.is_init():
            # needs open a connection first:
            _db_ctx.init()
            self.should_close_conn = True
        _db_ctx.transactions = _db_ctx.transactions + 1
        log.logger.debug('begin transaction...' if _db_ctx.transactions == 1 else 'join current transaction...')
        return self

    def __exit__(self, exctype, excvalue, traceback):
        global _db_ctx
        _db_ctx.transactions = _db_ctx.transactions - 1
        try:
            if _db_ctx.transactions == 0:
                if exctype is None:
                    self.commit()
                else:
                    self.rollback()
        finally:
            if self.should_close_conn:
                _db_ctx.cleanup()

    def commit(self):
        global _db_ctx
        log.logger.debug('commit transaction...')
        try:
            _db_ctx.connection.commit()
            log.logger.debug('commit ok.')
        except:
            logging.warning('commit failed. try rollback...')
            _db_ctx.connection.rollback()
            logging.warning('rollback ok.')
            raise

    def rollback(self):
        global _db_ctx
        log.logger.debug('manully rollback transaction...')
        _db_ctx.connection.rollback()
        logging.info('rollback ok.')


def transaction():
    """
    Create a transaction object so can use with statement:

    with transaction():
        pass

    >>> def update_profile(id, name, rollback):
    ...     u = dict(id=id, name=name, email='%s@test.org' % name, passwd=name, last_modified=time.time())
    ...     insert('user', **u)
    ...     r = update('update user set passwd=? where id=?', name.upper(), id)
    ...     if rollback:
    ...         raise StandardError('will cause rollback...')
    >>> with transaction():
    ...     update_profile(900301, 'Python', False)
    >>> select_one('select * from user where id=?', 900301).name
    u'Python'
    >>> with transaction():
    ...     update_profile(900302, 'Ruby', True)
    Traceback (most recent call last):
      ...
    StandardError: will cause rollback...
    >>> select('select * from user where id=?', 900302)
    []
    """
    return _TransactionCtx()


def with_db_transaction(func):
    """
    A decorator that makes function around transaction.

    >>> @with_transaction
    ... def update_profile(id, name, rollback):
    ...     u = dict(id=id, name=name, email='%s@test.org' % name, passwd=name, last_modified=time.time())
    ...     insert('user', **u)
    ...     r = update('update user set passwd=? where id=?', name.upper(), id)
    ...     if rollback:
    ...         raise StandardError('will cause rollback...')
    >>> update_profile(8080, 'Julia', False)
    >>> select_one('select * from user where id=?', 8080).passwd
    u'JULIA'
    >>> update_profile(9090, 'Robert', True)
    Traceback (most recent call last):
      ...
    StandardError: will cause rollback...
    >>> select('select * from user where id=?', 9090)
    []
    """
    @functools.wraps(func)
    def _wrapper(*args, **kw):
        _start = time.time()
        with _TransactionCtx():
            return func(*args, **kw)
        _profiling(_start)
    return _wrapper


def _select(sql, first, *args):
    # execute select SQL and return unique result or list results.
    global _db_ctx, _db_convert
    cursor = None
    """
    if _db_convert != '?':
        sql = sql.replace('?', _db_convert)
    """
    log.logger.debug('SQL: %s, ARGS: %s' % (sql, args))
    start = time.time()
    try:
        cursor = _db_ctx.connection.cursor()
        cursor.execute(sql, args)
        if cursor.description:
            names = [x[0] for x in cursor.description]
        if first:
            values = cursor.fetchone()
            if not values:
                return None
            return Dict(names, values)
        return [Dict(names, x) for x in cursor.fetchall()]
    except mysql.connector.Error as e:
        log.logger.error('_select error!{0}'.format(e))
        """
        connection not available, need reconnect
        """
        if str(e) == "MySQL Connection not available.":
            log.logger.info("No connection. Trying to reconnect...")
            _db_ctx.connection.connection = None
            return False
        else:
            return None
    finally:
        if cursor:
            _db_ctx.connection.commit()
            cursor.close()
        _profiling(start, sql)


@with_db_connection
def query(table, key, fields=None, **params):
    start = None
    offset = None
    search_info = None
    search_info_item = None
    sort_by = None
    is_and = True
    is_desc = True
    one_key_name = False
    if key:
        key_names = list(key.keys())
        key_values = list(key.values())
        length = len(key_names)
        if length == 1 and isinstance(key_values[0], list):
            one_key_name = True
            length = len(key_values[0])
            key_values = key_values[0]
    else:
        length = 0

    if params:
        for param_key in params.keys():
            if param_key == "start":
                start = params['start']
            elif param_key == "offset":
                offset = params['offset']
            elif param_key == "search_info":
                search_info = params['search_info']
            elif param_key == "search_info_item":
                search_info_item = params['search_info_item']
            elif param_key == "sort_by":
                sort_by = params['sort_by']
            elif param_key == "is_desc":
                if params['is_desc'] == "true":
                    is_desc = True
            elif param_key == "is_and":
                if params['is_and'] != "true":
                    is_and = False
            else:
                log.logger.error("unknown param: {0}".format(param_key))
                return None

    if fields:
        if not isinstance(fields, list):
            log.logger.error("the type of fields must be list")
            return None
        else:
            field_str = ""
            field_len = len(fields)
            for i in range(0, field_len):
                field_str += str(fields[i])
                if i != (field_len - 1):
                    field_str += ","
    else:
        field_str = "*"

    if length != 0:
        sql_query = "SELECT " + field_str + " FROM " + table + " WHERE "
    else:
        sql_query = "SELECT " + field_str + " FROM " + table

    for i in range(0, length):
        if one_key_name is True:
            sql_query += key_names[0]
        else:
            sql_query += key_names[i]
        sql_query += " = "
        sql_query += "\""
        sql_query += str(key_values[i])
        sql_query += "\""
        if i != (length-1):
            if is_and:
                sql_query += " && "
            else:
                sql_query += " || "

    if search_info_item and search_info:
        if len(key) == 0:
            sql_query += "("
        else:
            sql_query += "&&("
        search_info_item_split = search_info_item.split('|')
        for i in range(0, len(search_info_item_split)):
            sql_query += search_info_item_split[i]
            sql_query += " like '%"
            sql_query += search_info
            sql_query += "%'||"
        sql_query = sql_query[:-2]
        sql_query += ")"

    if sort_by:
        sql_query += " ORDER BY "
        sql_query += sort_by
        if is_desc is True:
            sql_query += " DESC "
        else:
            sql_query += " ASC "

    if start and offset:
        start_str = str(int(start) - 1)
        offset_str = str(offset)
        sql_query += " limit "
        sql_query += start_str
        sql_query += ","
        sql_query += offset_str

    ret = _select(sql_query, False)
    if ret is False:
        ret = _select(sql_query, False)
        if ret is False:
            return None
    return ret


@with_db_connection
def query_one(table, key, fields=None, is_and=True):
    try:
        key_names = list(key.keys())
        key_values = list(key.values())
        length = len(key_names)
    except:
        log.logger.error("the type of key must be dictionary")
        return None

    if fields:
        if not isinstance(fields, list):
            log.logger.error("the type of fields must be list")
            return None
        else:
            field_str = ""
            field_len = len(fields)
            for i in range(0, field_len):
                field_str += str(fields[i])
                if i != (field_len - 1):
                    field_str += ","
    else:
        field_str = "*"

    sql_query = "SELECT " + field_str + " FROM " + table + " WHERE "
    for i in range(0, length):
        sql_query += key_names[i]
        sql_query += " = "
        sql_query += "\""
        sql_query += str(key_values[i])
        sql_query += "\""
        if i != (length-1):
            if is_and:
                sql_query += " && "
            else:
                sql_query += " || "

    sql_query += " limit 1"

    ret = _select(sql_query, True)
    if ret is False:
        ret = _select(sql_query, True)
        if ret is False:
            return None
    return ret


@with_db_connection
def query_all(table):
    sql_query = "SELECT * FROM " + table
    ret = _select(sql_query, False)
    if ret is False:
        ret = _select(sql_query, False)
        if ret is False:
            return None
    return ret


@with_db_connection
def query_records_num(table, key, field=None, **params):
    is_and = True
    if key:
        try:
            key_names = list(key.keys())
            key_values = list(key.values())
            length = len(key_names)
        except:
            log.logger.error("the type of key must be dictionary")
            return None
    else:
        length = 0

    if params:
        for param_key in params.keys():
            if param_key == "and":
                if params['and'] != "true":
                    is_and = False
            else:
                log.logger.error("unknown param: {0}".format(param_key))
                return None

    if length != 0:
        if field:
            sql_query = "SELECT COUNT(DISTINCT (" + field + ")) FROM " + table + " WHERE "
        else:
            sql_query = "SELECT  COUNT(*) FROM " + table + " WHERE "
    else:
        if field:
            sql_query = "SELECT COUNT(DISTINCT(" + field + ")) FROM " + table
        else:
            sql_query = "SELECT  COUNT(*) FROM " + table

    for i in range(0, length):
        sql_query += key_names[i]
        sql_query += " = "
        sql_query += "\""
        sql_query += str(key_values[i])
        sql_query += "\""
        if i != (length-1):
            if is_and:
                sql_query += " && "
            else:
                sql_query += " || "

    row = _select(sql_query, True)
    if row is False:
        row = _select(sql_query, True)
    if row is None or row is False:
        return None
    else:
        row_value = list(row.values())
        return row_value[0]

"""
@with_db_connection
def select_one(sql, *args):
    '''
    Execute select SQL and expected one result. 
    If no result found, return None.
    If multiple results found, the first one returned.

    >>> u1 = dict(id=100, name='Alice', email='alice@test.org', passwd='ABC-12345', last_modified=time.time())
    >>> u2 = dict(id=101, name='Sarah', email='sarah@test.org', passwd='ABC-12345', last_modified=time.time())
    >>> insert('user', **u1)
    1
    >>> insert('user', **u2)
    1
    >>> u = select_one('select * from user where id=?', 100)
    >>> u.name
    u'Alice'
    >>> select_one('select * from user where email=?', 'abc@email.com')
    >>> u2 = select_one('select * from user where passwd=? order by email', 'ABC-12345')
    >>> u2.name
    u'Alice'
    '''
    return _select(sql, True, *args)

@with_db_connection
def select_int(sql, *args):
    '''
    Execute select SQL and expected one int and only one int result. 

    >>> n = update('delete from user')
    >>> u1 = dict(id=96900, name='Ada', email='ada@test.org', passwd='A-12345', last_modified=time.time())
    >>> u2 = dict(id=96901, name='Adam', email='adam@test.org', passwd='A-12345', last_modified=time.time())
    >>> insert('user', **u1)
    1
    >>> insert('user', **u2)
    1
    >>> select_int('select count(*) from user')
    2
    >>> select_int('select count(*) from user where email=?', 'ada@test.org')
    1
    >>> select_int('select count(*) from user where email=?', 'notexist@test.org')
    0
    >>> select_int('select id from user where email=?', 'ada@test.org')
    96900
    >>> select_int('select id, name from user where email=?', 'ada@test.org')
    Traceback (most recent call last):
        ...
    MultiColumnsError: Expect only one column.
    '''
    d = _select(sql, True, *args)
    if len(d)!=1:
        raise MultiColumnsError('Expect only one column.')
    return d.values()[0]

@with_db_connection
def select(sql, *args):
    '''
    Execute select SQL and return list or empty list if no result.

    >>> u1 = dict(id=200, name='Wall.E', email='wall.e@test.org', passwd='back-to-earth', last_modified=time.time())
    >>> u2 = dict(id=201, name='Eva', email='eva@test.org', passwd='back-to-earth', last_modified=time.time())
    >>> insert('user', **u1)
    1
    >>> insert('user', **u2)
    1
    >>> L = select('select * from user where id=?', 900900900)
    >>> L
    []
    >>> L = select('select * from user where id=?', 200)
    >>> L[0].email
    u'wall.e@test.org'
    >>> L = select('select * from user where passwd=? order by id desc', 'back-to-earth')
    >>> L[0].name
    u'Eva'
    >>> L[1].name
    u'Wall.E'
    '''
    return _select(sql, False, *args)
"""


@with_db_connection
def _update(sql, args, post_fn=None):
    global _db_ctx, _db_convert
    cursor = None
    """
    if _db_convert != '?':
        sql = sql.replace('?', _db_convert)
    """
    log.logger.debug('SQL: %s, ARGS: %s' % (sql, args))
    start = time.time()
    try:
        cursor = _db_ctx.connection.cursor()
        cursor.execute(sql, args)
        r = cursor.rowcount
        if _db_ctx.transactions == 0:
            # no transaction enviroment:
            log.logger.debug('auto commit')
            _db_ctx.connection.commit()
            post_fn and post_fn()
        return r
    except mysql.connector.Error as e:
        log.logger.error('_update error!{0}'.format(e))
        if str(e) == "MySQL Connection not available.":
            log.logger.info("No connection. Trying to reconnect...")
            _db_ctx.connection.connection = None
        return 0
    finally:
        if cursor:
            cursor.close()
        _profiling(start, sql)


@with_db_connection
def _update_many(sql, args, post_fn=None):
    global _db_ctx, _db_convert
    cursor = None
    """
    if _db_convert != '?':
        sql = sql.replace('?', _db_convert)
    """
    log.logger.debug('SQL: %s, ARGS: %s' % (sql, args))
    start = time.time()
    try:
        cursor = _db_ctx.connection.cursor()
        cursor.executemany(sql, args)
        r = cursor.rowcount
        if _db_ctx.transactions == 0:
            # no transaction enviroment:
            log.logger.debug('auto commit')
            _db_ctx.connection.commit()
            post_fn and post_fn()
        return r
    except mysql.connector.Error as e:
        log.logger.error('_update_many error!{0}'.format(e))
        if str(e) == "MySQL Connection not available.":
            log.logger.info("No connection. Trying to reconnect...")
            _db_ctx.connection.connection = None
        return 0
    finally:
        if cursor:
            cursor.close()
        _profiling(start, sql)


def insert(table, record):
    try:
        record_keys = list(record.keys())
        length = len(record_keys)
    except:
        log.logger.error("the type of record must be dictionary")
        return False

    str_name = "("
    for i in range(0, length):
        if i == (length-1):
            str_name += record_keys[i]
            str_name += ")"
        else:
            str_name += record_keys[i]
            str_name += ","
    str_value = "("
    for i in range(0, length):
        if i == (length-1):
            str_value += "%("
            str_value += record_keys[i]
            str_value += ")s)"
        else:
            str_value += "%("
            str_value += record_keys[i]
            str_value += ")s,"
    sql_insert = "INSERT INTO " + table + " " + str_name + " VALUES " + str_value

    ret = _update(sql_insert, record)
    if ret == 0:
        ret = _update(sql_insert, record)
    if ret > 0:
        return True
    else:
        return False


def insert_many(table, names, values):
    if not isinstance(values, (list, tuple)):
        log.logger.error("the type of values must be list or tuple")
        return False

    length = len(names)
    str_name = "("
    for i in range(0, length):
        if i == (length-1):
            str_name += names[i]
            str_name += ")"
        else:
            str_name += names[i]
            str_name += ","
    str_value = "("
    for i in range(0, length):
        if i == (length-1):
            str_value += "%s)"
        else:
            str_value += "%s,"
    sql_insert = "INSERT INTO " + table + " " + str_name + " VALUES " + str_value

    ret = _update_many(sql_insert, values)
    if ret == 0:
        ret = _update_many(sql_insert, values)
    if ret > 0:
        return True
    else:
        return False


def delete_all(table):
    sql_delete = "DELETE FROM " + table
    ret = _update(sql_delete, None)
    if ret == 0:
        ret = _update(sql_delete, None)
    if ret > 0:
        return True
    else:
        return False


def delete(table, key, is_and=True):
    try:
        key_names = list(key.keys())
        key_values = list(key.values())
        length = len(key_names)
    except:
        log.logger.error("the type of key must be dictionary")
        return False

    sql_delete = "DELETE FROM " + table + " WHERE "
    for i in range(0, length):
        sql_delete += key_names[i]
        sql_delete += "="
        sql_delete += "\""
        sql_delete += str(key_values[i])
        sql_delete += "\""
        if i != (length-1):
            if is_and:
                sql_delete += " && "
            else:
                sql_delete += " || "

    ret = _update(sql_delete, None)
    if ret == 0:
        ret = _update(sql_delete, None)
    if ret > 0:
        return True
    else:
        return False


def update(table, record, key):
    try:
        record_keys = list(record.keys())
        record_values = list(record.values())
        r_length = len(record_keys)
    except:
        log.logger.error("the type of record must be dictionary")
        return False

    try:
        if key:
            key_keys = list(key.keys())
            key_values = list(key.values())
            k_length = len(key_keys)
        else:
            k_length = 0
    except:
        log.logger.error("the type of key must be dictionary")
        return False

    str_record = ""
    for i in range(0, r_length):
        str_record += str(record_keys[i])
        str_record += "="
        str_record += "\""
        str_record += str(record_values[i])
        str_record += "\""
        if i != (r_length-1):
            str_record += ","
    str_key = ""
    for i in range(0, k_length):
        str_key += key_keys[i]
        str_key += "="
        str_key += "\""
        str_key += str(key_values[i])
        str_key += "\""
        if i != (k_length-1):
            str_key += " and "
    sql_update = "UPDATE " + table + " SET " + str_record
    if len(str_key) != 0:
        sql_update = sql_update + " WHERE " + str_key
    ret = _update(sql_update, None)
    if ret == 0:
        ret = _update(sql_update, None)
    if ret > 0:
        return True
    else:
        return False


"""
def insert(table, **kw):
    '''
    Execute insert SQL.

    >>> u1 = dict(id=2000, name='Bob', email='bob@test.org', passwd='bobobob', last_modified=time.time())
    >>> insert('user', **u1)
    1
    >>> u2 = select_one('select * from user where id=?', 2000)
    >>> u2.name
    u'Bob'
    >>> insert('user', **u2)
    Traceback (most recent call last):
      ...
    IntegrityError: UNIQUE constraint failed: user.id
    '''
    cols, args = zip(*kw.iteritems())
    sql = 'insert into %s (%s) values (%s)' % (table, ','.join(cols), ','.join([_db_convert for i in range(len(cols))]))
    return _update(sql, args)

def update(sql, *args):
    '''
    Execute update SQL.

    >>> u1 = dict(id=1000, name='Michael', email='michael@test.org', passwd='123456', last_modified=time.time())
    >>> insert('user', **u1)
    1
    >>> u2 = select_one('select * from user where id=?', 1000)
    >>> u2.email
    u'michael@test.org'
    >>> u2.passwd
    u'123456'
    >>> update('update user set email=?, passwd=? where id=?', 'michael@example.org', '654321', 1000)
    1
    >>> u3 = select_one('select * from user where id=?', 1000)
    >>> u3.email
    u'michael@example.org'
    >>> u3.passwd
    u'654321'
    '''
    return _update(sql, args)

def update_kw(table, where, *args, **kw):
    '''
    Execute update SQL by table, where, args and kw.

    >>> u1 = dict(id=900900, name='Maya', email='maya@test.org', passwd='MAYA', last_modified=time.time())
    >>> insert('user', **u1)
    1
    >>> u2 = select_one('select * from user where id=?', 900900)
    >>> u2.email
    u'maya@test.org'
    >>> u2.passwd
    u'MAYA'
    >>> update_kw('user', 'id=?', 900900, name='Kate', email='kate@example.org')
    1
    >>> u3 = select_one('select * from user where id=?', 900900)
    >>> u3.name
    u'Kate'
    >>> u3.email
    u'kate@example.org'
    >>> u3.passwd
    u'MAYA'
    '''
    if len(kw)==0:
        raise ValueError('No kw args.')
    sqls = ['update', table, 'set']
    params = []
    updates = []
    for k, v in kw.iteritems():
        updates.append('%s=?' % k)
        params.append(v)
    sqls.append(', '.join(updates))
    sqls.append('where')
    sqls.append(where)
    sql = ' '.join(sqls)
    params.extend(args)
    return update(sql, *params)
"""


def init_connector(func_connect, convert_char='%s'):
    global _db_connect, _db_convert
    log.logger.info('init connector...')
    _db_connect = func_connect
    _db_convert = convert_char


def init(db_type, db_schema=None, db_host=None, db_port=0, db_user=None, db_password=None, db_driver=None, **db_args):
    """
    Initialize database.

    Args:
      db_type: db type, 'mysql', 'sqlite3'.
      db_schema: schema name.
      db_host: db host.
      db_user: username.
      db_password: password.
      db_driver: db driver, default to None.
      **db_args: other parameters, e.g. use_unicode=True
    """
    global _db_connect, _db_convert
    if db_type == 'mysql':
        log.logger.info('init mysql...')
        default_args = {
            'host': '127.0.0.1',
            'port': 3306,
            'user': '',
            'password': '',
            'database': db_schema,
            'use_unicode': True,
            'charset': 'utf8',
            'collation': 'utf8_general_ci'
        }
        for k, v in default_args.items():
            db_args[k] = db_args.get(k, v)
        _db_connect = lambda: mysql.connector.connect(**db_args)
        _db_convert = '%s'
    elif db_type == 'sqlite3':
        log.logger.info('init sqlite3...')
        import sqlite3
        _db_connect = lambda: sqlite3.connect(db_schema)
    else:
        raise DBError('Unsupported db: %s' % db_type)



