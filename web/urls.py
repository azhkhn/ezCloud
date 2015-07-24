#!/usr/bin/env python
# -*- coding:UTF-8 -*-

__author__ = 'avy'
__date__ = '15-1-10'
__time__ = '9:16'
__description__ = 'url map'

from web.handle.HomeHandler import *
from web.handle.config_device import *
from web.handle.config_ssid import *
from web.handle.mgmt_network import *
from web.handle.mgmt_system import *
from web.handle.mgmt_user import *
from web.handle.monitor import *
from web.handle.dashboard import *

URLS = [
    (r"/", HomeHandler),
    (r"/monitor-overview.html", MonitorOverviewPageHandler),
    (r"/configure-overview.html", OverviewPageHandler),
    (r"/configure-ssid.html", SsidPageHandler),
    (r"/configure-device.html", DevicePageHandler),
    (r"/configure-ssidsummary.html", SsidSummaryPageHandler),	
    (r"/management-system.html", SystemPageHandler),
    (r"/management-userconfig.html", UserconfigPageHandler),
    (r"/management-user.html", UseraddconfigPageHandler),
    (r"/management-firmware.html", FirmwarePageHandler),
    (r"/management-network.html", NetworkPageHandler),
    (r"/(.*).html", PageHandler),

    #dashboard
    (r"/get-domain-map-list", GetDomainMapHandler),
    (r"/get-networks-ap-info", GetNetworkApHandler),
    (r"/get-ap-cpu-connetnum", GetApCpuHandler),
    
    # get device type handler(base on all network)
    (r"/get-device-type", GetDeviceTypeHandler),
    # get country code list handler
    (r"/get-country-list", GetCountryListHandler),

    # configure-device handler
    (r"/get-configure-overview-search", GetConfigureOverviewsearchHandler),
    (r"/get-configure-overview", GetConfigureOverviewHandler),
    (r"/get-network-name-list", GetNetworkNameHandler),
    (r"/get-configure-adddev", GetConfigureAddDevHandler),
    (r"/get-configure-device", GetConfigureDevHandler),
    (r"/get-device-list-search", GetDevListsearchHandler),
    (r"/get-device-list", GetDevListHandler),
    (r"/get-radio2ssid-list", GetRadio2SSIDHandler),
    (r"/add-device", AddDeviceHandler),
    (r"/operate-device", OperateDeviceHandler),
    (r"/set-device-basic", ConfigureDevBasicHandler),
    (r"/set-device-radio", ConfigureDevRadioHandler),
    (r"/set-device-ssid", ConfigureDevSSIDHandler),
    (r"/set-device-ssid-batch", ConfigureSSIDBatchHandler),
    (r"/set-device-ip", ConfigureDevIPHandler),
    (r"/set-device-upgrade", ConfigureDevUpgradeHandler),
    (r"/set-device-advance", ConfigureDevAdvanceHandler),
    (r"/del-device-batch", DeleteDeviceBatchHandler),
    (r"/add-device-map", AddDeviceMapHandler),

    # configure-ssid handler
    (r"/get-ssidtemplateinfo", GetSSIDTemplateInfoHandler),
    (r"/get-ssid--summary", GetSSIDSummaryHandler),
    (r"/get-ssid-list", GetSSIDListHandler),
    (r"/get-ssid-list-search", GetSSIDListSearchHandler),
    (r"/set-ssidtemplateinfo", ConfigureSSIDSummaryHandler),
    (r"/add-ssid", AddSSIDHandler),
    (r"/set-ssid-Basic-info", ConfigureSSIDHandlerBasic),
    (r"/set-ssid-Security-info", ConfigureSSIDHandlerSecurity),
    (r"/set-ssid-Radius-info", ConfigureSSIDHandlerRadius),
    (r"/set-ssid-Group-info", ConfigureSSIDHandlerGroup),
    (r"/set-ssid-Portal-info", ConfigureSSIDHandlerPortal),
    (r"/set-ssid-Summary-info", ConfigureSSIDSummaryHandler),

    # monitor
    (r"/monitored-devices-get", MonitoredDeviceGetHandler), 
    (r"/specific-network-data-get", SpecificNetworkDataGetHandler),
    (r"/networklist-get", NetworkListGetHandler),
    (r"/networklist-get-search", NetworkListSearchGetHandler),
    (r"/device-pm-get", DevicePMGetHandler),
    (r"/device-link-status-get", DeviceLinkStatusGetHandler),
    (r"/network-devices-get", NetworkDeviceGetHandler),
    (r"/device-heartbeat-log-get", DeviceHeartBeatLogGetHandler),
    (r"/device-monitor-set", NetworkDeviceMonitorSetHandler),       

    # Management-firmware handler
    (r"/upload_firmware", UploadFirmwareHandler),
    (r"/get_firmwareList", GetFirmwareListHandler),
    (r"/get_firmwareFile", GetFirmwareFileHandler),

    # Management-network handler
    (r"/configure-network", ConfigureNetworkHandler),
    (r"/set-network-basic", ConfigureNetworkBasicHandler),
    (r"/set-network-upgrade-rule", ConfigureNetworkUpRuleHandler),
    (r"/get-network-upgrade-rule", GetNetworkUpgradeRuleHandler),
    (r"/get-system-info", GetSystemInfoHandler),

    # Management-system handler
    (r"/get-system-basic", GetSystemBasicHandler),
    (r"/get-system-upgrade-method", GetSystemUpgradeMethodHandler),
    (r"/set-system-basic", ConfigureSystemBasicHandler),
    (r"/set-system-upgrade-method", ConfigureSystemUpgradeMethodHandler),
    (r"/upload_network_map", UploadNetworkMapHandler),
    (r"/get-network-map", GetNetworkMapHandler),
    (r"/system-config-management", ConfigureSystemManagementHandler),
    (r"/system-reboot-restart", SystemRebootHandler),

    # Mangement-user and login handler by mouxiaohuan
    (r"/get_domain_id_list", GetUserDomainHandler),
    (r"/user_login", UserLoginHandler),
    (r"/add-user", AddUserHandler),
    (r"/delete-user-name", DeleteUserHandler),
    (r"/get-group-user-info", GetGroupUserInfoHandler),
    (r"/set-user-editpassword", EditPasswordUserHandler),
    (r"/set-user-editinfo", EditInfoUserHandler),
    (r"/get-current-groupId", GetUserGroupIdHandler),
]
