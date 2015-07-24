__author__ = 'wangtao'

import mysql.connector
import threading
from common.log import *


class MysqlConnDb(object):
    def __init__(self, *args, **kwargs):
        self._db = None
        self._conn = None
        self._db_args = args
        self._db_kwargs = kwargs
        self._mutex = threading.Lock()

    def connect(self, **kwargs):
        if len(kwargs) > 0:
            try:
                self._conn = mysql.connector.connect(**kwargs)
                self._db = self._conn.cursor()
                return True
            except mysql.connector.Error as e:
                log.logger.error('connect fails!{}'.format(e))
                return False
        else:
            log.logger.error("the config of mysql database is invalid!")
            return False

    def insert(self, table, record):
        ret = False
        try:
            record_keys = list(record.keys())
            length = len(record_keys)
        except:
            log.logger.error("the type of record must be dictionary")
            return ret

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
        log.logger.debug("SQL execute:{0} {1}".format(sql_insert, record))
        try:
            self._mutex.acquire()
            self._db.execute(sql_insert, record)
            self._conn.commit()
            self._mutex.release()
            ret = True
        except mysql.connector.Error as e:
            log.logger.error('[DataBase]insert error!{}'.format(e))
            ret = False

        return ret

    def insert_many(self, table, names, values):
        ret = False
        if not isinstance(values, (list, tuple)):
            log.logger.error("the type of values must be list or tuple")
            return

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
        log.logger.debug("SQL execute:{0} {1}".format(sql_insert, names))
        try:
            self._mutex.acquire()
            self._db.executemany(sql_insert, values)
            self._conn.commit()
            self._mutex.release()
            ret = True
        except mysql.connector.Error as e:
            log.logger.error('[DataBase]insert many error!{}'.format(e))
            ret = False

        return ret

    def query(self, table, key, fields=None, **params):
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
                    else:
                        is_desc = False
                elif param_key == "is_and":
                    if params['is_and'] != "true":
                        is_and = False
                else:
                    log.logger.error("unknown param: {0}".format(param_key))
                    return None
        else:
            log.logger.debug("params is none")

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

        log.logger.debug("SQL execute:{0}".format(sql_query))
        try:
            self._mutex.acquire()
            self._db.execute(sql_query)
            self._mutex.release()
            col_names = list(self._db.column_names)
            length = len(col_names)
            res_list = []
            for row in self._db.fetchall():
                row_values = list(row)
                row_dict = {}
                for i in range(0, length):
                    row_dict[col_names[i]] = row_values[i]
                res_list.append(row_dict)
            self._conn.commit()
            if len(res_list) == 0:
                return None
            else:
                return res_list
        except mysql.connector.Error as e:
            log.logger.error('query error!{}'.format(e))
            return None

    def query_one(self, table, key, fields=None, is_and=True):
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
        log.logger.debug("SQL execute:{0}".format(sql_query))
        try:
            self._mutex.acquire()
            self._db.execute(sql_query)
            self._mutex.release()
            col_names = list(self._db.column_names)
            length = len(col_names)
            res_list = []
            for row in self._db.fetchall():
                row_values = list(row)
                row_dict = {}
                for i in range(0, length):
                    row_dict[col_names[i]] = row_values[i]
                res_list.append(row_dict)
            self._conn.commit()
            if len(res_list) == 0:
                return None
            else:
                return res_list[0]
        except mysql.connector.Error as e:
            log.logger.error('query error!{}'.format(e))
            return None

    def query_all(self, table):
        sql_query = "SELECT * FROM " + table
        log.logger.debug("SQL execute:{0}".format(sql_query))
        try:
            self._mutex.acquire()
            self._db.execute(sql_query)
            self._mutex.release()
            col_names = list(self._db.column_names)
            length = len(col_names)
            res_list = []
            for row in self._db.fetchall():
                row_values = list(row)
                row_dict = {}
                for i in range(0, length):
                    row_dict[col_names[i]] = row_values[i]
                res_list.append(row_dict)
            self._conn.commit()
            if len(res_list) == 0:
                return None
            else:
                return res_list
        except mysql.connector.Error as e:
            log.logger.error('query_all error!{}'.format(e))
            return None

    def query_records_num(self, table, key, **params):
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
        else:
            log.logger.debug("params is none")

        if length != 0:
            sql_query = "SELECT  COUNT(*) FROM " + table + " WHERE "
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

        log.logger.debug("SQL execute:{0}".format(sql_query))
        try:
            self._mutex.acquire()
            self._db.execute(sql_query)
            self._mutex.release()
            row_dict = {}
            row = self._db.fetchone()
            self._conn.commit()
            if row is None:
                return None
            else:
                row_value = list(row)
                return row_value[0]
        except mysql.connector.Error as e:
            log.logger.error('query error!{}'.format(e))
            return None

    def query_field_count(self, table, key, field=None):
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

        if length != 0:
            if field:
                sql_query = "SELECT COUNT(DISTINCT (" + field + ")) FROM " + table + " WHERE "
            else:
                sql_query = "SELECT COUNT(*) FROM " + table + " WHERE "
        else:
            if field:
                sql_query = "SELECT COUNT(DISTINCT(" + field + ")) FROM " + table
            else:
                sql_query = "SELECT COUNT(*) FROM " + table

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

        log.logger.debug("SQL execute:{0}".format(sql_query))
        try:
            self._mutex.acquire()
            self._db.execute(sql_query)
            self._mutex.release()
            row_dict = {}
            row = self._db.fetchone()
            self._conn.commit()
            if row is None:
                return None
            else:
                row_value = list(row)
                return row_value[0]
        except mysql.connector.Error as e:
            log.logger.error('query error!{}'.format(e))
            return None

    def delete_all(self, table):
        ret = False
        sql_delete = "DELETE FROM " + table
        log.logger.debug("SQL execute:{0}".format(sql_delete))
        try:
            self._mutex.acquire()
            self._db.execute(sql_delete)
            self._conn.commit()
            self._mutex.release()
            ret = True
        except mysql.connector.Error as e:
            log.logger.error('delete_all error!{}'.format(e))
            ret = False
        return ret

    def delete(self, table, key, is_and=True):
        ret = False
        try:
            key_names = list(key.keys())
            key_values = list(key.values())
            length = len(key_names)
        except:
            log.logger.error("the type of key must be dictionary")
            return None

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
        log.logger.debug("SQL execute:{0}".format(sql_delete))
        try:
            self._mutex.acquire()
            self._db.execute(sql_delete)
            self._conn.commit()
            self._mutex.release()
            ret = True
        except mysql.connector.Error as e:
            log.logger.error('delete error!{}'.format(e))
            ret = False
        return ret

    def update(self, table, record, key):
        ret = False
        try:
            record_keys = list(record.keys())
            record_values = list(record.values())
            r_length = len(record_keys)
        except:
            log.logger.error("the type of record must be dictionary")
            return ret

        try:
            if key:
                key_keys = list(key.keys())
                key_values = list(key.values())
                k_length = len(key_keys)
            else:
                k_length = 0
        except:
            log.logger.error("the type of key must be dictionary")
            return ret

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
        log.logger.debug("SQL execute:{0}".format(sql_update))
        try:
            self._mutex.acquire()
            self._db.execute(sql_update)
            self._conn.commit()
            self._mutex.release()
            ret = True
        except mysql.connector.Error as e:
            log.logger.error('update error!{}'.format(e))
            ret = False
        return ret

    def close(self):
        self._db.close()
        self._conn.close()
