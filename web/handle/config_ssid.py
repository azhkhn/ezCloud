__author__ = 'wangtao'

import tornado.web
import tornado.gen
import os.path
import time
import tcelery
from task import *
from web.handle.HomeHandler import BaseHandler
import json


class GetSSIDSummaryHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        network = self.get_argument("network")
        offset = self.get_argument("offset")
        start = self.get_argument("start")
        search = {"network_name": network, "offset": offset, "start": start}
        resp = yield tornado.gen.Task(task.get_ssid_summary_task.apply_async, args=[search])
        ssids = resp.result
        ssid_string = json.dumps(ssids)
        self.write(ssid_string)


class GetSSIDListHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        network = self.get_argument("network")
        offset = self.get_argument("offset")
        start = self.get_argument("start")
        search_info=None
        resp = yield tornado.gen.Task(task.get_ssid_list_task.apply_async,args=[{"network":network,"start":start,"offset":offset,"search_info":search_info}])
        ssids = resp.result
        ssid_string = json.dumps(ssids)
        self.write(ssid_string)


class GetSSIDListSearchHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        network = self.get_argument("network")
        search_info = self.get_argument("search_info")
        start = None
        offset = None
        resp = yield tornado.gen.Task(task.get_ssid_list_task.apply_async, args=[
            {"network": network, "start": start, "offset": offset, "search_info": search_info}])
        ssids = resp.result
        ssid_string = json.dumps(ssids)
        self.write(ssid_string)


class AddSSIDHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        ssidname = self.get_argument("addSsidName")
        network_name = self.get_argument("network")
        ssidcfg = {'ssid_name': ssidname, "network_name": network_name}
        resp = yield tornado.gen.Task(task.add_ssid_template_task.apply_async, args=[ssidcfg])
        self.render("configure-ssid.html", back_network_name=network_name, add_back_info=resp.result)

    @BaseHandler.auth
    def get(self, *args, **kwargs):
        self.render("configure-ssid.html", back_network_name="default_network", add_back_info="ok")


class ConfigureSSIDHandlerBasic(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        ssid_name = self.get_argument("ssid_name")
        network_name = self.get_argument("network")
        curr_ssid_name = str(self.get_argument("curr_ssid_name"))
        resp = yield tornado.gen.Task(task.get_network_id_task.apply_async, args=[{'network_name':network_name}])
        network_id = resp.result
        find = {"network_id": network_id, "ssid_name": str(curr_ssid_name)}
        resp = yield tornado.gen.Task(task.get_ssid_template_id_task.apply_async, args=[find])
        ssid_template_id = resp.result        
        
        station_number = int(self.get_argument("station_number"))
        ssid_broadcast = int(self.get_argument("ssid_broadcast"))
        ssid_isolate = int(self.get_argument("ssid_isolate"))
        ssid_wds = int(self.get_argument("ssid_wds"))
        # ratelimit
        rate_limit_enable = self.get_argument("rate_limit_enable")
        us_rate_limit = self.get_argument("us_rate_limit")
        ds_rate_limit = self.get_argument("ds_rate_limit")
        
        ssidcfg = {'network_id': int(network_id), 'id': int(ssid_template_id), 'ssid_name': ssid_name,
                   'ssid_broadcast': int(ssid_broadcast), 'ssid_isolate': int(ssid_isolate),
                   'ssid_wds': int(ssid_wds), 'rate_limit_enable': int(rate_limit_enable),
                   'ds_rate_limit': int(ds_rate_limit), 'us_rate_limit': int(us_rate_limit),
                   'station_number': int(station_number)}
        resp = yield tornado.gen.Task(task.Update_SsidBasicCfg_task.apply_async, args=[ssidcfg])   
        if ssid_name != curr_ssid_name:
            return self.render("configure-ssid.html", back_network_name=network_name, add_back_info=resp.result)
        self.render("configure-ssidsummary.html", back_network_name=network_name, add_back_info=resp.result)


class ConfigureSSIDHandlerSecurity(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        ssid_name = self.get_argument("ssidname")
        network_name = self.get_argument("network")
        resp = yield tornado.gen.Task(task.get_network_id_task.apply_async, args=[{'network_name':network_name}])
        network_id = resp.result
        find = {"network_id": network_id, "ssid_name": str(ssid_name)}
        resp = yield tornado.gen.Task(task.get_ssid_template_id_task.apply_async, args=[find])
        ssid_template_id = resp.result         
        # security
        security_type = self.get_argument("security_type")
        wep_key = self.get_argument("wepText")
        wep_key_len = -1
        wep_key_type = -1
        wep_key_index = -1
        #wpa_encry_type = self.get_argument("wpa2pskType")
        wpa_encry_type = 0
        wpa_psk = self.get_argument("wpa2psk")
        
        if security_type == "open":
            sec = {'security_type': security_type, 'ssid_template_id': int(ssid_template_id),'network_id': int(network_id)}
        elif security_type == "wep":
            sec = {'security_type': security_type, 'wep_key': wep_key, 'wep_key_len': wep_key_len,
                   'wep_key_type': wep_key_type, 'wep_key_index': wep_key_index,
                   'ssid_template_id': int(ssid_template_id),'network_id': int(network_id)}
        elif (security_type == "wpa2-psk")or(security_type == "wpawpa2-psk"):#WPA2-PSK/WPAWPA2-PSK
            sec = {'security_type': security_type, 'wpa_encry_type': wpa_encry_type,
                   'wpa_psk': wpa_psk, 'ssid_template_id': int(ssid_template_id),'network_id': int(network_id)}
        elif (security_type == "wpawpa2_eap")or(security_type == "wpa2_eap"):#WPA2EAP/WPAWPA2EAP
            sec = {'security_type': security_type, 'ssid_template_id': int(ssid_template_id),'network_id': int(network_id)}
        elif security_type == "portal":#web/mac
            sec = {'security_type': security_type, 'ssid_template_id': int(ssid_template_id),'network_id': int(network_id)}
        resp = yield tornado.gen.Task(task.Update_SsidSecCfg_task.apply_async, args=[sec])
        self.render("configure-ssidsummary.html", back_network_name=network_name, add_back_info=resp.result)


class ConfigureSSIDHandlerRadius(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        ssid_name = self.get_argument("ssidname")
        network_name = self.get_argument("network")
        resp = yield tornado.gen.Task(task.get_network_id_task.apply_async, args=[{'network_name': network_name}])
        network_id = resp.result
        find = {"network_id": network_id, "ssid_name": str(ssid_name)}
        resp = yield tornado.gen.Task(task.get_ssid_template_id_task.apply_async, args=[find])
        ssid_template_id = resp.result         
        #radius
        rsp_time = self.get_argument("rsp_time")
        retry_time = self.get_argument("retry_time")
        main_auth_ip = self.get_argument("main_auth_ip")
        main_acct_ip = self.get_argument("main_acct_ip")
        main_auth_port = self.get_argument("main_auth_port")
        main_acct_port = self.get_argument("main_acct_port")
        main_auth_secret = self.get_argument("main_auth_secret")
        main_acct_secret = self.get_argument("main_acct_secret")
        backup_auth_ip = self.get_argument("backup_auth_ip")
        backup_acct_ip = self.get_argument("backup_acct_ip")
        #backup_auth_port = int(self.get_argument("backup_auth_port"))if self.get_argument("backup_auth_port") else self.get_argument("backup_auth_port")
        #backup_acct_port = int(self.get_argument("backup_acct_port"))if self.get_argument("backup_acct_port") else self.get_argument("backup_acct_port")
        if self.get_argument("backup_auth_port"):
        	backup_auth_port = int(self.get_argument("backup_auth_port"))	
        else:
        	backup_auth_port = 1812	
        if self.get_argument("backup_acct_port"):
        	backup_acct_port = int(self.get_argument("backup_acct_port"))	
        else:
        	backup_acct_port = 1812	        	
        backup_auth_secret = self.get_argument("backup_auth_secret")
        backup_acct_secret = self.get_argument("backup_acct_secret")
        radius = {'ssid_template_id': int(ssid_template_id), 'rsp_time': int(rsp_time), 'retry_time': int(retry_time),
                  'main_auth_port': int(main_auth_port), 'main_acct_port': int(main_acct_port),
                  'main_auth_secret': main_auth_secret, 'main_acct_secret': main_acct_secret,
                  'main_auth_ip': main_auth_ip, 'main_acct_ip': main_acct_ip, 'backup_auth_ip': backup_auth_ip,
                  'backup_acct_ip': backup_acct_ip, 'backup_auth_port': backup_auth_port,
                  'backup_acct_port': backup_acct_port, 'backup_auth_secret': backup_auth_secret,
                  'backup_acct_secret': backup_acct_secret}
        resp = yield tornado.gen.Task(task.Update_RadiusCfg_task.apply_async, args=[radius])
        self.render("configure-ssidsummary.html", back_network_name=network_name, add_back_info=resp.result)


class ConfigureSSIDHandlerGroup(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        ssid_name = self.get_argument("ssidname")
        network_name = self.get_argument("network")
        resp = yield tornado.gen.Task(task.get_network_id_task.apply_async, args=[{'network_name':network_name}])
        network_id = resp.result
        find = {"network_id":network_id,"ssid_name":str(ssid_name)}
        resp = yield tornado.gen.Task(task.get_ssid_template_id_task.apply_async, args=[find])
        ssid_template_id = resp.result        
        
        ftid_tmp = self.get_arguments("filter_id_all")
        vlan_id = self.get_arguments("vlan_id_all")
        egress_rate = self.get_arguments("egress_rate_all")
        print("cgi filterid is {0}".format(ftid_tmp));
        print("cgi vlan_id is {0}".format(vlan_id));
        print("cgi egress_rate is {0}".format(egress_rate));
        resp = yield tornado.gen.Task(task.Del_filteridCfg_task.apply_async, args=[{'ssid_template_id':int(ssid_template_id)}])
        k=1
        filterIds = ftid_tmp[0].split('/')
        lenth = len(filterIds)
        print(lenth)
        vlan_id = vlan_id[0].split('/')
        #egress_method = egress_method[0].split('/')
        egress_rate = egress_rate[0].split('/')
        for filter_id in filterIds:
            if (filter_id!='') :                    
                filter_id={"ssid_template_id":int(ssid_template_id),"filter_id":filter_id,
                            "vlan_id":vlan_id[k],"egress_method":0,"egress_rate":egress_rate[k]}
                k+=1
                resp = yield tornado.gen.Task(task.Update_filteridCfg_task.apply_async, args=[filter_id])
        self.render("configure-ssidsummary.html",back_network_name=network_name,add_back_info=resp.result)


class ConfigureSSIDHandlerPortal(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        ssid_name = self.get_argument("ssidname")
        network_name = self.get_argument("network")
        resp = yield tornado.gen.Task(task.get_network_id_task.apply_async, args=[{'network_name':network_name}])
        network_id = resp.result
        find = {"network_id": network_id, "ssid_name": str(ssid_name)}
        resp = yield tornado.gen.Task(task.get_ssid_template_id_task.apply_async, args=[find])
        ssid_template_id = resp.result         
        #portal
        portal_name = self.get_argument("portal_name")
        portal_url = self.get_argument("portal_url")
        uam_secret = self.get_argument("uam_secret")
        portal = {'portal_name': portal_name, 'portal_url': portal_url, 'uam_secret': uam_secret,
                  'ssid_template_id': int(ssid_template_id)}
        resp = yield tornado.gen.Task(task.Update_PortalCfg_task.apply_async, args=[portal])
        
        resp = yield tornado.gen.Task(task.Del_WallGardenCfg_task.apply_async,
                                      args=[{'ssid_template_id': int(ssid_template_id)}])
        url_tmp = self.get_arguments("domain_all")
        url_tmp = url_tmp[0].split('/')
        for i in url_tmp:
            if i != '':
                urlcfg = {"ssid_template_id": int(ssid_template_id), "url": i}
                resp = yield tornado.gen.Task(task.Update_WallGardenCfg_task.apply_async, args=[urlcfg])
        
        self.render("configure-ssidsummary.html", back_network_name=network_name, add_back_info=resp.result)


class GetSSIDTemplateInfoHandler(BaseHandler):
    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self, *args, **kwargs):
        ssid_name = self.get_argument("ssidname")
        network_name = self.get_argument("network")
        search = {"network_name": network_name, "ssid_name": str(ssid_name)}
        resp = yield tornado.gen.Task(task.get_ssidtemplate_task.apply_async, args=[search])
        template = resp.result
        resp_json = json.dumps(template)
        if resp_json:
            self.write(resp_json)


class ConfigureSSIDSummaryHandler(BaseHandler):
    post_allowed = True

    @BaseHandler.auth
    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        if self.post_allowed is False:
            raise tornado.web.HTTPError(403)
        # basic
        network_name = self.get_argument("network")
        curr_ssid_name = str(self.get_argument("ssidname"))
        resp = yield tornado.gen.Task(task.get_network_id_task.apply_async, args=[{'network_name': network_name}])
        network_id = resp.result
        find = {"network_id": network_id, "ssid_name": str(curr_ssid_name)}
        ssid_action = self.get_argument("ssid_action")
        if ssid_action == "delete":
            resp = yield tornado.gen.Task(task.deletessid_task.apply_async, args=[find])
            return self.render("configure-ssid.html", back_network_name=network_name, add_back_info=resp.result)
        station_number = int(self.get_argument("station_number"))
        ssid_broadcast = int(self.get_argument("ssid_broadcast"))
        ssid_isolate = int(self.get_argument("ssid_isolate"))
        ssid_wds = int(self.get_argument("ssid_wds"))
        # ratelimit
        rate_limit_enable = self.get_argument("rate_limit_enable")
        us_rate_limit = self.get_argument("us_rate_limit")
        ds_rate_limit = self.get_argument("ds_rate_limit")
        # security
        security_type = self.get_argument("security_type")
        wep_key = self.get_argument("wepText")
        wep_key_len = -1
        wep_key_type = -1
        wep_key_index = -1
        wpa_encry_type = self.get_argument("wpa2pskType")
        wpa_psk = self.get_argument("wpa2pskText")
        # ssid_template_id
        resp = yield tornado.gen.Task(task.get_ssid_template_id_task.apply_async, args=[find])
        tmpId = resp.result
        ssid_template_id = tmpId

        if ssid_name != curr_ssid_name:
            curr_ssid_name = ssid_name

        ssidcfg = {
            'network_id': int(network_id), 'id': int(ssid_template_id), 'ssid_name': str(curr_ssid_name),
            'ssid_broadcast': int(ssid_broadcast), 'ssid_isolate': int(ssid_isolate), 'ssid_wds': int(ssid_wds),
            'rate_limit_enable': int(rate_limit_enable), 'ds_rate_limit': int(ds_rate_limit),
            'us_rate_limit': int(us_rate_limit), 'station_number': int(station_number)}

        # radius
        rsp_time = self.get_argument("rsp_time")
        retry_time = self.get_argument("retry_time")
        main_auth_ip = self.get_argument("main_auth_ip")
        main_acct_ip = self.get_argument("main_acct_ip")
        main_auth_port = self.get_argument("main_auth_port")
        main_acct_port = self.get_argument("main_acct_port")
        main_auth_secret = self.get_argument("main_auth_secret")
        main_acct_secret = self.get_argument("main_acct_secret")
        backup_auth_ip = self.get_argument("backup_auth_ip")
        backup_acct_ip = self.get_argument("backup_acct_ip")
        backup_auth_port = int(self.get_argument("backup_auth_port"))if self.get_argument("backup_auth_port") else self.get_argument("backup_auth_port")
        backup_acct_port = int(self.get_argument("backup_acct_port"))if self.get_argument("backup_acct_port") else self.get_argument("backup_acct_port")
        backup_auth_secret = self.get_argument("backup_auth_secret")
        backup_acct_secret = self.get_argument("backup_acct_secret")
        radius = {
            'ssid_template_id': int(ssid_template_id), 'rsp_time': int(rsp_time), 'retry_time': int(retry_time),
            'main_auth_port': int(main_auth_port), 'main_acct_port': int(main_acct_port),
            'main_auth_secret': main_auth_secret, 'main_acct_secret': main_acct_secret,
            'main_auth_ip': main_auth_ip, 'main_acct_ip': main_acct_ip, 'backup_auth_ip': backup_auth_ip,
            'backup_acct_ip': backup_acct_ip, 'backup_auth_port': backup_auth_port,
            'backup_acct_port': backup_acct_port, 'backup_auth_secret': backup_auth_secret,
            'backup_acct_secret': backup_acct_secret
        }
        
        # groupid
        if (security_type == "wpawpa2_eap")or(security_type == "wpa2_eap")or(security_type == "portal"):
            ftid_tmp = self.get_arguments("filter_id_all")
            vlan_id = self.get_arguments("vlan_id_all")
            egress_rate = self.get_arguments("egress_rate_all")
            resp = yield tornado.gen.Task(task.Del_filteridCfg_task.apply_async,
                                          args=[{'ssid_template_id': int(ssid_template_id)}])
            k = 1
            filterIds = ftid_tmp[0].split('/')
            vlan_id = vlan_id[0].split('/')
            egress_rate = egress_rate[0].split('/')
            for filter_id in filterIds:
                if filter_id != '':
                    filter_id = {"ssid_template_id": int(ssid_template_id), "filter_id": filter_id,
                                 "vlan_id": vlan_id[k], "egress_method": 0, "egress_rate": egress_rate[k]}
                    k += 1
                    resp = yield tornado.gen.Task(task.Update_filteridCfg_task.apply_async, args=[filter_id])
        if security_type == "open":
            sec = {'security_type': security_type, 'ssid_template_id': int(ssid_template_id),'network_id':network_id}
        elif security_type == "wep":
            sec = {
                'security_type': security_type, 'wep_key': wep_key, 'wep_key_len': wep_key_len,
                'wep_key_type': wep_key_type, 'wep_key_index': wep_key_index,'network_id':network_id,
                'ssid_template_id': int(ssid_template_id)
            }
        elif (security_type == "wpawpa2_eap")or(security_type == "wpa2_eap"):#WPA2EAP/WPAWPA2EAP
            sec = {
                'security_type': security_type, 'ssid_template_id': int(ssid_template_id),'network_id':network_id
            }
            resp = yield tornado.gen.Task(task.Update_RadiusCfg_task.apply_async,args=[radius])
        elif security_type == "portal":#web/mac
            sec = {
                'security_type': security_type,' ssid_template_id': int(ssid_template_id),'network_id':network_id
            }
            # wallgarden
            portal_name = self.get_argument("portal_name")
            portal_url = self.get_argument("portal_url")
            uam_secret = self.get_argument("uam_secret")
            portal = {'portal_name': portal_name, 'portal_url': portal_url, 'uam_secret': uam_secret, 'ssid_template_id':int(ssid_template_id)}
            resp = yield tornado.gen.Task(task.Update_PortalCfg_task.apply_async, args=[portal])
            # url
            resp = yield tornado.gen.Task(task.Del_WallGardenCfg_task.apply_async,
                                          args=[{'ssid_template_id': int(ssid_template_id)}])
            url_tmp = self.get_arguments("domain_all")
            url_tmp = url_tmp[0].split('/')
            for i in url_tmp:
                if i != '':
                    urlcfg = {"ssid_template_id": int(ssid_template_id), "url": i}
                    resp = yield tornado.gen.Task(task.Update_WallGardenCfg_task.apply_async, args=[urlcfg])

            resp = yield tornado.gen.Task(task.Update_RadiusCfg_task.apply_async, args=[radius])
        resp = yield tornado.gen.Task(task.Update_SsidSecCfg_task.apply_async, args=[sec])
        resp = yield tornado.gen.Task(task.Update_ssidCfg_task.apply_async, args=[ssidcfg])
        url = "configure-ssidsummary.html"
        self.render(url)
