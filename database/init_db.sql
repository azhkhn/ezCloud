-- init the data for ac data base

-- -----------------------------------------------------
-- Set all support device data to table `cigwmsdb`.`Device_Type_Define`
-- -----------------------------------------------------
-- WF-180 device type
use cigwmsdb;
insert into Device_Type_Define(
  dev_feature_code,
  dev_model,
  dev_vendor,
  model_name,
  cap_2g_chain,
  cap_2g_ssid_num,
  cap_2g_service_mode,
  cap_2g_80211_mode,
  cap_2g_band_width,
  cap_2g_tx_power_min,
  cap_2g_tx_power_max,
  cap_5g_chain,
  cap_5g_ssid_num,
  cap_5g_service_mode,
  cap_5g_80211_mode,
  cap_5g_band_width,
  cap_5g_tx_power_min,
  cap_5g_tx_power_max,
  eth_port1_type) 
values("80010101","WF-180","CIG", "11ac2x2IndoorAP",2,16,7,14,3,14,23,2,16,7,25,7,14,23,7); 

-- WF-122 device type
insert into Device_Type_Define(
  dev_feature_code,
  dev_model,
  dev_vendor,
  model_name,
  cap_2g_chain,
  cap_2g_ssid_num,
  cap_2g_service_mode,
  cap_2g_80211_mode,
  cap_2g_band_width,
  cap_2g_tx_power_min,
  cap_2g_tx_power_max,
  cap_5g_chain,
  cap_5g_ssid_num,
  cap_5g_service_mode,
  cap_5g_80211_mode,
  cap_5g_band_width,
  cap_5g_tx_power_min,
  cap_5g_tx_power_max,
  eth_port1_type) 
values("009d10105","WF-122","CIG", "11n2x2IndoorAP",2,16,7,14,3,10,21,2,16,7,9,3,10,21,7); 

-- WF-610/WF_630R1 device type
insert into Device_Type_Define(
  dev_feature_code,
  dev_model,
  dev_vendor,
  model_name,
  cap_2g_chain,
  cap_2g_ssid_num,
  cap_2g_service_mode,
  cap_2g_80211_mode,
  cap_2g_band_width,
  cap_2g_tx_power_min,
  cap_2g_tx_power_max,
  cap_5g_chain,
  cap_5g_ssid_num,
  cap_5g_service_mode,
  cap_5g_80211_mode,
  cap_5g_band_width,
  cap_5g_tx_power_min,
  cap_5g_tx_power_max,
  eth_port1_type) 
values("80020101","WF-610","CIG", "11ac2x2OutdoorAP",2,16,7,14,3,18,27,2,16,7,25,7,18,27,7); 

-- WF-96 device type
insert into Device_Type_Define(
  dev_feature_code,
  dev_model,
  dev_vendor,
  model_name,
  cap_2g_chain,
  cap_2g_ssid_num,
  cap_5g_chain,
  cap_5g_ssid_num,
  cap_5g_service_mode,
  cap_5g_80211_mode,
  cap_5g_band_width,
  cap_5g_tx_power_min,
  cap_5g_tx_power_max,
  eth_port1_type) 
values("80020201","WF-96","CIG", "11ac2x2CPE",0,0,2,16,7,25,7,18,27,7);

-- -----------------------------------------------------
-- Set default network to table `cigwmsdb`.`System_Config_Domain`
-- -----------------------------------------------------
insert into System_Config_Domain(
  id,
  domain_name,
  timezone
) 
values(1, "default_domain", 8);  

-- -----------------------------------------------------
-- Set default network to table `cigwmsdb`.`System_Config_Network`
-- -----------------------------------------------------
insert into System_Config_Network(
  network_name,
  domain_id
) 
values("default_network", 1); 

-- -----------------------------------------------------
-- Set default upgrade rule to table `cigwmsdb`.`System_Config_DeviceUpgrade`
-- -----------------------------------------------------
DROP PROCEDURE IF EXISTS `cigwmsdb`.`init_network_upgrade`;
DELIMITER $
create procedure init_network_upgrade()
begin
declare net_id int;
declare devtype_id int;
select id into net_id from System_Config_Network where network_name="default_network";
select id into devtype_id from Device_Type_Define where dev_model="WF-180";
insert into System_Config_DeviceUpgrade(network_id,dev_type_id,plan_version) values(net_id,devtype_id,"R0.0.00.000");
select id into devtype_id from Device_Type_Define where dev_model="WF-122";
insert into System_Config_DeviceUpgrade(network_id,dev_type_id,plan_version) values(net_id,devtype_id,"R0.0.00.000");
select id into devtype_id from Device_Type_Define where dev_model="WF-610/630R1";
insert into System_Config_DeviceUpgrade(network_id,dev_type_id,plan_version) values(net_id,devtype_id,"R0.0.00.000");
select id into devtype_id from Device_Type_Define where dev_model="WF-96";
insert into System_Config_DeviceUpgrade(network_id,dev_type_id,plan_version) values(net_id,devtype_id,"R0.0.00.000");
end;$
DELIMITER ;
call init_network_upgrade(); 


-- -----------------------------------------------------
-- Set country channel info to table `cigwmsdb`.`Device_Country_Channel_Define`
-- -----------------------------------------------------

-- Support CHINA
insert into Device_Country_Channel_Define(
  radio_type,
  country_code,
  support_channel_num,
  channel_list
) 
values("2.4g", "CHINA", 14, "0,1,2,3,4,5,6,7,8,9,10,11,12,13"); 
insert into Device_Country_Channel_Define(
  radio_type,
  country_code,
  support_channel_num,
  channel_list
) 
values("5g", "CHINA", 14, "0,36,40,44,48,52,56,60,64,149,153,157,161,165"); 

-- Support USA
insert into Device_Country_Channel_Define(
  radio_type,
  country_code,
  support_channel_num,
  channel_list
) 
values("2.4g", "USA", 12, "0,1,2,3,4,5,6,7,8,9,10,11"); 
insert into Device_Country_Channel_Define(
  radio_type,
  country_code,
  support_channel_num,
  channel_list
) 
values("5g", "USA", 25, "0,36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,149,153,157,161,165"); 

-- Support EURO
insert into Device_Country_Channel_Define(
  radio_type,
  country_code,
  support_channel_num,
  channel_list
) 
values("2.4g", "EURO", 14, "0,1,2,3,4,5,6,7,8,9,10,11,12,13"); 
insert into Device_Country_Channel_Define(
  radio_type,
  country_code,
  support_channel_num,
  channel_list
) 
values("5g", "EURO", 20, "0,36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140");

-- -----------------------------------------------------
-- Set default user group info to table `cigwmsdb`.`System_Config_Group`
-- -----------------------------------------------------
insert into System_Config_Group(
  user_group_type,
  management_user,
  management_networks,
  management_system,
  configure,
  monitor,
  diagnose
) 
values("administrator", 1, 1, 1, 1, 1, 1);
insert into System_Config_Group(
  user_group_type,
  management_user,
  management_networks,
  management_system,
  configure,
  monitor,
  diagnose
) 
values("operator",1, 0, 1, 1, 1, 1);
insert into System_Config_Group(
  user_group_type,
  management_user,
  management_networks,
  management_system,
  configure,
  monitor,
  diagnose
) 
values("monitor", 1, 0, 0, 0, 1, 0);
-- -----------------------------------------------------
-- Set default user group info to table `cigwmsdb`.`System_Config_PageMapping`
-- -----------------------------------------------------
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/add-device", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/operate-device", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-device-basic", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-device-radio", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-device-ssid", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-device-ip", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-device-advance", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-ssidtemplateinfo", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/add-ssid", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-ssid-Basic-info", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-ssid-Security-info", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-ssid-Radius-info", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-ssid-Group-info", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-ssid-Portal-info", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-ssid-Summary-info", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/upload_firmware", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/configure-network", 1, 0, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-network-basic", 1, 0, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-network-upgrade-rule", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-system-basic", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/set-system-upgrade-method", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/upload_network_map", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/system-config-management", 1, 1, 0);
insert into System_Config_PageMapping(
  uri,
  administrator,
  operator,
  monitor
)
values("/system-reboot-restart", 1, 1, 0);
-- -----------------------------------------------------
-- Set default upgrade method to table `cigwmsdb`.`System_Config_UpgradeMethod`
-- -----------------------------------------------------
insert into System_Config_UpgradeMethod(
  domain_id,
  upgrade_mode,
  upgrade_user,
  upgrade_password,
  remote
)
values(1, "ftp", "wms", "wms", 0);
-- -----------------------------------------------------
-- Set default user to table `cigwmsdb`.`System_Config_User`
-- -----------------------------------------------------
DROP PROCEDURE IF EXISTS `cigwmsdb`.`init_system_user`;
DELIMITER $
create procedure init_system_user()
begin
declare sys_domain_id int default 1;
declare group_id int default 1;
select id into sys_domain_id from System_Config_Domain where domain_name="default_domain";
select id into group_id from System_Config_Group where user_group_type="administrator";
insert into System_Config_User(user_name,domain_id,user_password,user_group_id) values("admin", sys_domain_id, "password", group_id);
end;$
DELIMITER ;
call init_system_user();

