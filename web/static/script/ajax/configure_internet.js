var dd_bridge_vlan_counter=2;
var dd_bridge_identifier=2;
var dd_bridge_dhcp=1;
var interfaces={};
var bridges={};
var nats={};
var start_bridge_configuration="";
var start_interface_configuration=""; 
var debug_tcp=false;
var deviceWanIp="";
var deviceSubnetmask="";
/**
 * INITIALIZATION BRIDGES
 */
var bridge_1={};
bridge_1["id"]='1'; 
bridge_1["display"]="Bridged with WAN";
bridge_1["type"]="bridge_wan";
bridges[bridge_1["id"]]=bridge_1;
/**
 * INITIALIZATION interfaces
 */
dd_addNewInterface('1',"LAN", "1");
dd_addNewSsidInterface('2',"SSID 1 - Admin", "1");
dd_addNewSsidInterface('3',"SSID 2 - Voip_Wireless", "1");
dd_addNewSsidInterface('4',"SSID 3 - AAA", "1");
dd_addNewSsidInterface('5',"SSID 4 - BBB", "1");
dd_addNewSsidInterface('6',"SSID 5 - CCC", "1");
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function dd_isTanazaDevice(){
    return ($("#tanazaConfig")!=null && $("#tanazaConfig").length>0 && $("#tanazaConfig").attr("value")=='true' );
}
function dd_addNewInterface(id,ssid,group){
    var interface_1={};
    interface_1['id']=id;
    interface_1['display']=ssid;
    interface_1['type']="interface_lan";
    interface_1['group']=group;
    interface_1["todelete"]=false;
    interface_1["enabled"]=true;
    interfaces[interface_1['id']]=(interface_1);
    return interface_1;
}
function dd_addNewSsidInterface(id,ssid,group){
    var tmp=dd_addNewInterface(id,ssid,group);
    tmp['type']="interface_ssid";
    return tmp;
}
/**
 * INITIALIZES THE ENTIRE TABLE
 */
function dd_generateInternetTable_post(){
    $("#internetTable tr td .droppableElement").parent().parent().remove();
    for (var bridge_n in bridges) {  
        dd_addBridgeWithIdAndLabel(bridges[bridge_n]);
    }
    for (var interf in interfaces) {  
        if(interfaces[interf]["type"]=="interface_lan" || interfaces[interf]["enabled"]==true){
            dd_addInterface(interfaces[interf]);
        }
        
    }
    $("#internetTable .active_input:not(.vlaninput)").keyup(function() {
        internetConnectionSectionValidation();
    });
    internetConnectionSectionValidation();
    updateMainSize();
    $("#internetTable .active_input").hover(function() {
        if(!$(this).hasClass("focusField"))
            $(this).removeClass("idleField").addClass("hoverField");  
    } , function() {
        if(!$(this).hasClass("focusField"))
            $(this).removeClass("hoverField").addClass("idleField");  
    }); 
    $("#internetTable .active_input").focus(function() {
        $(this).removeClass("hoverField").addClass("focusField");  
    });
    $("#internetTable .active_input").blur(function() {
        $(this).removeClass("focusField").addClass("idleField");   
    });
    activateToolTip("#internetTable .tooltipElement");
}
/**
 * INITIALIZES THE ENTIRE TABLE
 */
function dd_generateInternetTable(){
    if(!dd_isTanazaDevice()){
        return;
    }
    //MARK ALL SSID INTERFACES TO BE DELETED (EXCEPT LAN INTERFACE)
    for (var intf in interfaces) {
        
        interfaces[intf]["enabled"]=false;
        interfaces[intf]["todelete"]=true;
        if(interfaces[intf]["type"]=="interface_lan"){
            interfaces[intf]["enabled"]=true;
            interfaces[intf]["todelete"]=false;
        }
    }
    //GET THE LIST OF SSIDS
    //SET TO NOT DELETED ALL THE INTERFACES THAT ARE IN THE SSIDS LIST AND ADD MISSING ONE TO BRIDGED TO WAN
    for(i=0;i<rows_ssid.length;i++){
        var ssid_n=null;
        switch(rows_ssid[i]['status']){
            /*STATUS:0...7
            0 = Ok
            NOT USED 1 = Sync with AP
            2 = Fix problem import
            3 = Fix problem conflict
            4 = Deleted
            5 = Deleted (Disabled Profile)
            6 = Fix problem import(Disabled Profile)
            7 = Fix problem conflict (Disabled Profile)*/
            // if status == ok then mark to not delete the ssid, and tell if is enabled or not
            case 0: //checked 
                ssid_n=dd_getOrAddInterfaceBySsid(rows_ssid[i]['ssid1']!=null?rows_ssid[i]['ssid1']:rows_ssid[i]['ssid2'])
                if(rows_ssid[i]['ssid_on']!=null && rows_ssid[i]['ssid_on']==1){
                    ssid_n["enabled"]=true;
                }
                else{
                    ssid_n["enabled"]=false;
                }
                ssid_n["todelete"]=false;
                break;
            case 1:
                ssid_n=dd_getOrAddInterfaceBySsid(rows_ssid[i]['ssid2'])
                if(rows_ssid[i]['ssid_on']!=null && rows_ssid[i]['ssid_on']==1){
                    ssid_n["enabled"]=true;
                }
                else{
                    ssid_n["enabled"]=false;
                }
                ssid_n["todelete"]=false;
                break;
            case 2: //checked
            case 3: //checked
            case 6:
            case 7:
                ssid_n=dd_getOrAddInterfaceBySsid(rows_ssid[i]['ssid1'])
                if(rows_ssid[i]['ssid_on']!=null && rows_ssid[i]['ssid_on']==1){
                    ssid_n["enabled"]=true;
                }else{
                    ssid_n["enabled"]=false;
                }
                ssid_n["todelete"]=false;
                break;
            case 4://checked
            case 5:
                ssid_n=dd_getInterfaceBySsid(rows_ssid[i]['ssid1']!=null?rows_ssid[i]['ssid1']:rows_ssid[i]['ssid2'])
                if(ssid_n!=null){
                    ssid_n["todelete"]=true;
                }
                break;
        }
    }
    for (intf in interfaces) {
        if(interfaces[intf]["type"]=="interface_ssid" && interfaces[intf]["todelete"]==true){
            //console.log("Deleting inteface");
            delete interfaces[intf];
        }
    }
    dd_generateInternetTable_post();
//REMOVE ALL INTERFACES THAT ARE MARKED FOR DELETION
//REDRAW
/*
    $("#internetTable tr td .droppableElement").parent().parent().remove();
    for (var bridge_n in bridges) {  
        dd_addBridgeWithIdAndLabel(bridges[bridge_n]);
    }
    for (var interf in interfaces) {  
        dd_addInterface(interfaces[interf]);
    }
    $("#internetTable .active_input").keyup(function() {
        internetConnectionSectionValidation();
    });
    internetConnectionSectionValidation();
    updateMainSize();*/
}

/**
 * Generates html structure for a bridge element (bridge,nat)
 */
function dd_addBridgeWithIdAndLabel(bridge){
    var bridge_identifier=bridge["id"];
    var bridge_type=bridge["type"];
    var bridge_label=bridge["display"];
    var text="";
    var text1="";
    var iefix="";
    if(jQuery.browser["msie"]!=null){
        iefix='<div style="height:15px;width:100%;clear:both"></div>';
    }
    // TODO differentiate html structure for bridges
    switch(bridge_type){
        case "bridge_pppoe":
        case "bridge_nat":
            
            var bridge_dhcp=bridge["dhcp"];
            
            text+='<tr><td colspan="2"><div style="float:right;cursor:pointer" onclick="if(confirm(\'Are you sure to want to delete this group and move all his interfaces to Bridged with WAN?\')){dd_removeBridge(\''+bridge_identifier+'\')}">Delete this group <img src="static/images/delete.gif" style="vertical-align:middle"/></div><div class="cleared"></div><div style="float:left" id="bridge_'+bridge_identifier+'" class="droppableElement '+bridge_type+'" ondrop="dd_drop(event)" ondragover="dd_allowDrop(event)"><h4>NATted through WAN + DHCP Server '+bridge_dhcp["id"]+'</h4>'+iefix+'</div>';
            text+='<div style="float:left"><div style="padding-left:10px">';
            
            
            text1=$("#dhcpserver_html").attr("value");
            text1=text1.replace("YYY",bridge_dhcp["id"]);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("XXX",bridge_identifier);
            text1=text1.replace("%GATEWAY%",bridge_dhcp["gateway"]);
            text1=text1.replace("%SUBNET%",bridge_dhcp["subnet"]);
            text1=text1.replace("%ADDRSTART%",bridge_dhcp["start_address"]);
            text1=text1.replace("%ADDREND%",bridge_dhcp["end_address"]);
            text1=text1.replace("%LEASE%",bridge_dhcp["lease"]);    
            //from firmware 2.2.0 and higher
            text1=text1.replace("%DNS1%",(bridge_dhcp["dns1"]!=null)?bridge_dhcp["dns1"]:"");  
            text1=text1.replace("%DNS2%",(bridge_dhcp["dns2"]!=null)?bridge_dhcp["dns2"]:"");
            text1=text1.replace("%DOMAIN%",(bridge_dhcp["domain"]!=null)?bridge_dhcp["domain"]:"");
            text1=text1.replace("%ISOLATE%",(bridge_dhcp["isolate"]!=null && bridge_dhcp["isolate"]=="1")?" checked=\"checked\" ":"");
            text+=text1;
            text+='</div></div><div class="cleared"></div></td></tr>';
            break;
        case "bridge_wan":
            text+='<tr><td colspan="2"><div id="bridge_'+bridge_identifier+'" class="droppableElement '+bridge_type+'" ondrop="dd_drop(event)" ondragover="dd_allowDrop(event)"><h4>'+bridge_label+'</h4>'+iefix+'</div></td></tr>';
            break;
        case "bridge_vlan":
            text+='<tr><td colspan="2"><div style="float:right;cursor:pointer" onclick="if(confirm(\'Are you sure to want to delete this group and move all his interfaces to Bridged with WAN?\')){dd_removeBridge(\''+bridge_identifier+'\')}">Delete this group <img src="static/images/delete.gif" style="vertical-align:middle"/></div><div class="cleared"></div><div id="bridge_'+bridge_identifier+'" class="droppableElement '+bridge_type+'" ondrop="dd_drop(event)" ondragover="dd_allowDrop(event)"><h4>Bridged with WAN and tagged with VLAN <input id="dd_vlan_value_'+bridge_identifier+'" maxlength="4" style="width:30px !important" value="'+bridge["vlan_id"]+'" class="active_input idleField vlaninput" onkeyup="dd_updateVlanValue(this)" /> <img class="tooltipElement" style="vertical-align:middle" src="static/images/help.png" alt="Help" title="Vlan id, unique value among all groups (2-4094)" /></h4>'+iefix+'</div></td></tr>';
            break;
    }
    $("#internetTable").append(text);
}
/**
 * Generates html structure for an interface and places it in the correct bridge group
 */
function dd_addInterface(interf){
    var text="";
    text+='<a href="#" class="draggableObj '+interf["type"]+'" id="ssid_'+interf['id']+'" draggable="true" ondragstart="dd_drag(event)" style="display:block">'+htmlEntities(interf['display'])+'<span class="captiveAlert" style="display:none" >This interface must be part of a NAT group</span><span class="captiveAlert" style="display:none;cursor:pointer !important" onclick="window.open(\'http://help.tanaza.com/customer/portal/articles/1320352-captive-portal-and-nat-configuration\',\'_blank\')">, click here to know more </span></a>';
    $("#bridge_"+interf["group"]).append(text);
}
/**
 * Help function to allow drop, nothing to do here
 */
function dd_allowDrop(ev){
    ev.preventDefault();
}
/**
 * Help function to allow drag, nothing to do here
 */
function dd_drag(ev){
    $(".draggableObj").removeClass("dragSelected");
    ev.dataTransfer.setData("Text",ev.target.id);
    $(ev.target).addClass("dragSelected");
}
/**
 * This function should update the javascript structure that maintains the logic of the bridges
 */
function dd_drop(ev){
    ev.preventDefault();
    var data=ev.dataTransfer.getData("Text");
    var id_bridge="";
    var dataid="";
    var oldBridge="";
    var intf=null;
    //$(ev.target).removeClass("dragSelected");
    // Drop over add new bridge/nat group
    if($(ev.target).hasClass("addBlock") || $(ev.target).parents().hasClass("addBlock")){
        // alert("aa -" + ($(ev.target).attr("id")=='addNat'?"true":"false")+" - "+$(ev.target).parents("[id='addNat']").length>0);
        if($(ev.target).attr("id")=='addVlan' || $(ev.target).parents("[id='addVlan']").length>0){
            id_bridge=dd_addVlan();
            //data has following format ssid_XXX
            dataid=data.substring(5);
            intf=dd_getInterfaceById(dataid);
            oldBridge=intf["group"];
            
            intf["group"]=""+id_bridge;
            
            /*if(dd_getBridgeById(oldBridge)["type"]!="bridge_wan" && dd_getCountOfBridge(oldBridge)==0){
                dd_removeBridge(oldBridge);
            }*/
        
            dd_generateInternetTable();
            $("#ssid_"+dataid).addClass("dragSelected");
        }
        if($(ev.target).attr("id")=='addNat' || $(ev.target).parents("[id='addNat']").length>0){
            id_bridge=dd_addNewNat();
            //data has following format ssid_XXX
            dataid=data.substring(5);
            intf=dd_getInterfaceById(dataid);
            oldBridge=intf["group"];
            
            intf["group"]=""+id_bridge;
            
            /*if(dd_getBridgeById(oldBridge)["type"]!="bridge_wan" && dd_getCountOfBridge(oldBridge)==0){
                dd_removeBridge(oldBridge);
            }*/
            dd_generateInternetTable();
            $("#ssid_"+dataid).addClass("dragSelected");
        }
    }
    else{
        // Drop over existing bridge/group
        dataid=data.substring(5);
        intf=dd_getInterfaceById(dataid);
        oldBridge=intf["group"];
        var targetid="";
        if($(ev.target).hasClass("droppableElement")){
            targetid=$(ev.target).attr("id");
        }
        else{
            targetid=$(ev.target).parents(".droppableElement").attr("id");
        }
        intf["group"]=targetid.substring(7);
        /*if(dd_getBridgeById(oldBridge)["type"]!="bridge_wan" && dd_getCountOfBridge(oldBridge)==0){
            dd_removeBridge(oldBridge);
        }*/
        // $(ev.target).parents(".droppableElement").append(document.getElementById(data));
       
        dd_generateInternetTable();
        $("#ssid_"+dataid).addClass("dragSelected");
    }
    
}

function dd_getInterfaceById(id){
    for (var intf in interfaces) {
        if(interfaces[intf]["id"]==id){
            return interfaces[intf];
        }
    }
    return null
}
function dd_getOrAddInterfaceBySsid(ssid){
    var tmp=dd_getInterfaceBySsid(ssid);
    if(tmp==null){
        //console.log("Interface not found, creating one");
        return dd_addNewSsidInterface(dd_getMaxInterfaceCounter(),ssid,"1")
    }
    //console.log("Interface found");
    return tmp;
}
function dd_getInterfaceBySsid(ssid){
    for (var intf in interfaces) {
        if(interfaces[intf]["display"]==ssid){
            return interfaces[intf];
        }
    }
    return null;
}
function dd_getMaxInterfaceCounter(){
    var start=2;
    for (var intf in interfaces) {
        if( parseInt(interfaces[intf]["id"])>start){
            start=parseInt(interfaces[intf]["id"])
        }
    }
    return start+1;
}
function dd_getMaxGroupCounter(){
    var start=2;
    for (var brid in bridges) {
        if( parseInt(bridges[brid]["id"])>start){
            start=parseInt(bridges[brid]["id"])
        }
    }
    return start+1;
}
function dd_getCountOfBridge(id){
    var counter=0;
    for (var intf in interfaces) {
        if(interfaces[intf]["group"]==id){
            counter++;
        }
    }
    return counter;
}
function dd_getBridgeById(id){
    for (var brid in bridges) {
        if(bridges[brid]["id"]==id){
            return bridges[brid];
        }
    }
    return null
}
function dd_removeBridge(id){
    for (var intf in interfaces) {
        if(interfaces[intf]["group"]==id){
            interfaces[intf]["group"]='1';
        }
    }
    for (var brid in bridges) {
        if(bridges[brid]["id"]==id){
            delete bridges[brid];
            break
        }
    }
    dd_generateInternetTable();
}
function dd_getNextVlanId(){
    var start=2;
    while(true){
        var found=false;
            internal:
            for (var brid in bridges) {
                if(bridges[brid]["type"]=="bridge_vlan"){
                    if(parseInt(bridges[brid]["vlan_id"]+"")==start){
                        found=true;
                        break internal;
                    }
                }
            }
        if(!found){
            return start;
        }
        else{
            start++;
        }
    }
}
function dd_getNextBridgeId(){
    var start=2;
    while(true){
        var found=false;
            internal:
            for (var brid in bridges) {
                if(parseInt(bridges[brid]["id"]+"")==start){
                    found=true;
                    break internal;
                }
            }
        if(!found){
            return start;
        }
        else{
            start++;
        }
    }
}
function dd_getNextDhcpId(){
    var start=1;
    while(true){
        var found=false;
            internal:
            for (var brid in bridges) {
                if(bridges[brid]["type"]=="bridge_nat"){
                    if(parseInt(bridges[brid]["dhcp"]["id"]+"")==start){
                        found=true;
                        break internal;
                    }
                }
            }
        if(!found){
            return start;
        }
        else{
            start++;
        }
    }
}
function dd_addVlan(){
    var id_dd_bridge_identifier=dd_getNextBridgeId();
    var vlanid=dd_getNextVlanId();
    bridge_1={};
    bridge_1["id"]=''+id_dd_bridge_identifier; 
    bridge_1["display"]="Bridged with WAN and tagged with VLAN "+vlanid;
    bridge_1["type"]="bridge_vlan"; 
    bridge_1["vlan_id"]=vlanid;
    bridges[bridge_1["id"]]=(bridge_1);
    return id_dd_bridge_identifier;
}
function dd_addNewNat(){
    var id_dd_bridge_identifier=dd_getNextBridgeId();
    var dhcp_id=dd_getNextDhcpId();
    bridge_1={};
    bridge_1["id"]=''+id_dd_bridge_identifier; 
    bridge_1["display"]="NATted through WAN + DHCP Server "+dhcp_id;
    bridge_1["type"]="bridge_nat";
    bridge_1["dhcp"]={};
    /*bridge_1["dhcp"]["gateway"]="192.168.0.1";
    bridge_1["dhcp"]["subnet"]="255.255.255.0";
    bridge_1["dhcp"]["start_address"]="192.168.0.2";
    bridge_1["dhcp"]["end_address"]="192.168.0.254";
    bridge_1["dhcp"]["lease"]="3600";*/
    bridge_1["dhcp"]["id"]=""+dhcp_id;
    
    var basenetwork=0;
    var finaleGatway="";
    var finalSubnet="";
    var start_address="";
    var end_address="";
    var end=false;
    var bb=null;
    deviceWanIp=$("#f_tcp_ip").attr("value");
    deviceSubnetmask=$("#f_tcp_subnet").attr("value");
    if(deviceWanIp!=null && deviceWanIp!=""){
        if(!deviceWanIp.startsWith("10.")){
            end=false;
                external:while(!end){
                    for(bb in bridges){
                        if(bridges[bb]["dhcp"]!=null && bridges[bb]["dhcp"]["gateway"]!=null && bridges[bb]["dhcp"]["gateway"].startsWith("10."+basenetwork+".")){
                            basenetwork++;
                            end=false;
                            continue external;
                        }
                    }
                    end=true;
                }
            finaleGatway="10."+basenetwork+".0.1";
            start_address="10."+basenetwork+".0.2";
            end_address="10."+basenetwork+".255.254";
            finalSubnet="255.255.0.0";
        }
        else{
            if(deviceSubnetmask.startsWith("255.255.")){
                var sindex=deviceWanIp.indexOf(".",3);
                basenetwork=parseInt(deviceWanIp.substring(3,sindex));
                basenetwork++;
                end=false;
                    external:while(!end){
                        for(bb in bridges){
                            if(bridges[bb]["dhcp"]!=null && bridges[bb]["dhcp"]["gateway"]!=null && bridges[bb]["dhcp"]["gateway"].startsWith("10."+basenetwork+".")){
                                basenetwork++;
                                end=false;
                                continue external;
                            }
                        }
                        end=true;
                    }
                finaleGatway="10."+basenetwork+".0.1";
                start_address="10."+basenetwork+".0.2";
                end_address="10."+basenetwork+".255.254";
                finalSubnet="255.255.0.0";
            }
            else{
                end=false;
                    external:while(!end){
                        for(bb in bridges){
                            if(bridges[bb]["dhcp"]!=null && bridges[bb]["dhcp"]["gateway"]!=null && bridges[bb]["dhcp"]["gateway"].startsWith("192.168."+basenetwork+".")){
                                basenetwork++;
                                end=false;
                                continue external;
                            }
                        }
                        end=true;
                    }
                finaleGatway="192.168."+basenetwork+".1";
                start_address="192.168."+basenetwork+".2";
                end_address="192.168."+basenetwork+".254";
                finalSubnet="255.255.255.0";
            }
        }
    }
    else{
        end=false;
        while(!end){
            for(bb in bridges){
                if(bridges[bb]["dhcp"]!=null && bridges[bb]["dhcp"]["gateway"]!=null && bridges[bb]["dhcp"]["gateway"].startsWith("10."+basenetwork+".")){
                    basenetwork++;
                    end=false;
                    continue;
                }
            }
            end=true;
        }
        finaleGatway="10."+basenetwork+".0.1";
        start_address="10."+basenetwork+".0.2";
        end_address="10."+basenetwork+".255.254";
        finalSubnet="255.255.0.0";
    }    
    bridge_1["dhcp"]["gateway"]=finaleGatway;
    bridge_1["dhcp"]["subnet"]=finalSubnet;
    bridge_1["dhcp"]["start_address"]=start_address;
    bridge_1["dhcp"]["end_address"]=end_address;
    bridge_1["dhcp"]["lease"]="43200";
    bridge_1["dhcp"]["dns1"]=finaleGatway;
    bridge_1["dhcp"]["dns2"]="";
    bridge_1["dhcp"]["domain"]="";
    bridge_1["dhcp"]["isolate"]="1";
    bridges[bridge_1["id"]]=(bridge_1);
    return id_dd_bridge_identifier;
}
function dd_addPPPoE(){

}


function internetConnectionSectionValidation(tcpsectionvalues){
    var values=new Array();
    var status=new Array();
    /**
       * Internet Connection
       */
    var bridge=null;
    var anyerrorCrossDhcp=false;
    $(".errorDhcpMsg").html("");
    for (var bridge_n in bridges) {   
        bridge=bridges[bridge_n];
        if(bridge["type"]=='bridge_nat'){
            var anyerror=false;
            var dhcp_gate=$("#dhcp_gateway_"+bridge["id"]).attr("value");
            status=new Array();
            status['identifier']="dhcp_gateway_"+bridge["id"];
            status['error']=false;
            status['modified']=false;
            if(isBlankOrNull(dhcp_gate) || !isValidIp(dhcp_gate)){
                status['error']=true;
                anyerror=true;
            }
            values.push(status);
            
            var dhcp_sub=$("#dhcp_subnet_"+bridge["id"]).attr("value");
            status=new Array();
            status['identifier']="dhcp_subnet_"+bridge["id"];
            status['error']=false;
            status['modified']=false;
            try{
                if(isBlankOrNull(dhcp_sub) || !isValidIp(dhcp_sub) ){
                    status['error']=true;
                    anyerror=true;
                }
                var sip_obj=new Subnet($("#dhcp_subnet_"+bridge["id"]).attr("value"));
            }catch(err){
                status['error']=true;
                anyerror=true;
                $("#dhcp_sub_"+bridge["id"]+" .errorDhcpMsg").html("Subnet address not valid");
                if(debug_tcp){
                    console.log("Catched error:"+err);
                }
            }
            values.push(status);
            
            var dhcp_start=$("#dhcp_addr_start_"+bridge["id"]).attr("value");
            status=new Array();
            status['identifier']="dhcp_addr_start_"+bridge["id"];
            status['error']=false;
            status['modified']=false;
            if(isBlankOrNull(dhcp_start) || !isValidIp(dhcp_start)){
                status['error']=true;
                anyerror=true;
            }
            values.push(status);
            
            var dhcp_end=$("#dhcp_addr_end_"+bridge["id"]).attr("value");
            status=new Array();
            status['identifier']="dhcp_addr_end_"+bridge["id"];
            status['error']=false;
            status['modified']=false;
            if(isBlankOrNull(dhcp_end) || !isValidIp(dhcp_end)){
                status['error']=true;
                anyerror=true;
            }
            values.push(status);
            
            var dhcp_lease=$("#dhcp_lease_"+bridge["id"]).attr("value");
            status=new Array();
            status['identifier']="dhcp_lease_"+bridge["id"];
            status['error']=false;
            status['modified']=false;
            if(isBlankOrNull(dhcp_lease) || !isValidPositiveNumberOrZero(dhcp_lease) || parseInt(dhcp_lease)<120 || parseInt(dhcp_lease)>172800){
                status['error']=true;
                anyerror=true;
            }
            values.push(status);
            
            if($("#dhcp_dns1_"+bridge["id"])!=null && $("#dhcp_dns1_"+bridge["id"]).length>0){
                var dhcp_dns1=$("#dhcp_dns1_"+bridge["id"]).attr("value");
                status=new Array();
                status['identifier']="dhcp_dns1_"+bridge["id"];
                status['error']=false;
                status['modified']=false;
                if(!isBlankOrNull(dhcp_dns1) && !isValidDns(dhcp_dns1)){
                    status['error']=true;
                    anyerror=true;
                }
                values.push(status);
                
                var dhcp_dns2=$("#dhcp_dns2_"+bridge["id"]).attr("value");
                status=new Array();
                status['identifier']="dhcp_dns2_"+bridge["id"];
                status['error']=false;
                status['modified']=false;
                if(!isBlankOrNull(dhcp_dns2) && !isValidDns(dhcp_dns2)){
                    status['error']=true;
                    anyerror=true;
                }
                values.push(status);
                
                var dhcp_domain=$("#dhcp_domain_"+bridge["id"]).attr("value");
                status=new Array();
                status['identifier']="dhcp_domain_"+bridge["id"];
                status['error']=false;
                status['modified']=false;
                if(!isBlankOrNull(dhcp_domain) && !isValidDomainName(dhcp_domain)){
                    status['error']=true;
                    anyerror=true;
                }
                values.push(status);
            }
            /**
             * Check Coherence
             **/ 
            anyerrorCrossDhcp=anyerrorCrossDhcp | anyerror;
            if(!anyerror){
                var gip=new IPv4(dhcp_gate);
                var sip=new Subnet(dhcp_sub);
                var startip=new IPv4(dhcp_start);
                var endip=new IPv4(dhcp_end);
                var ipv4interface=new IPv4Interface(gip.raw()+sip.toSlash());
                if(!ipv4interface.contains(startip)){
                    anyerror=true;
                    if(debug_tcp){
                        console.log("Start ip not in range");
                    }
                    for(var i=0;i<values.length;i++){
                        if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_addr_start_"+bridge["id"]){
                            values[i]['error']=true;
                        }
                    }
                    $("#dhcp_sub_"+bridge["id"]+" .errorDhcpMsg").html("Start ip not included in network range</br>("+ipv4interface.first()+"-"+ipv4interface.last()+")");
                }
                else{
                    if(!ipv4interface.contains(endip)){
                        anyerror=true;
                        if(debug_tcp){
                            console.log("End ip not in range");
                        }
                        for(var i=0;i<values.length;i++){
                            if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_addr_end_"+bridge["id"]){
                                values[i]['error']=true;
                            }
                        }
                        $("#dhcp_sub_"+bridge["id"]+" .errorDhcpMsg").html("End ip not included in network range</br>("+ipv4interface.first()+"-"+ipv4interface.last()+")");
                    }
                    else{
                        if(endip.lt(startip)){
                            anyerror=true;
                            if(debug_tcp){
                                console.log("End ip lower than start ip");
                            }
                            for(var i=0;i<values.length;i++){
                                if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_addr_end_"+bridge["id"]){
                                    values[i]['error']=true;
                                }
                            }
                            $("#dhcp_sub_"+bridge["id"]+" .errorDhcpMsg").html("End ip is lower then start ip");
                        }
                        else{
                            if(gip.gte(startip) &&  gip.lte(endip)){
                                anyerror=true;
                                if(debug_tcp){
                                    console.log("Gateway ip contained in range");
                                }
                                for(var i=0;i<values.length;i++){
                                    if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_gateway_"+bridge["id"]){
                                        values[i]['error']=true;
                                    }
                                    if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_addr_start_"+bridge["id"]){
                                        values[i]['error']=true;
                                    }
                                    if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_addr_end_"+bridge["id"]){
                                        values[i]['error']=true;
                                    }
                                }
                                $("#dhcp_sub_"+bridge["id"]+" .errorDhcpMsg").html("Gateway ip should not be contained in client ip range</br>("+ipv4interface.first()+"-"+ipv4interface.last()+")");
                            }else{
                                deviceWanIp=$("#f_tcp_ip").attr("value");
                                deviceSubnetmask=$("#f_tcp_subnet").attr("value");
                                if(!isBlankOrNull(deviceWanIp) && !isBlankOrNull(deviceSubnetmask)){
                                    if(isValidIp(deviceWanIp) && isValidNetmask(deviceSubnetmask)){
                                        try{
                                            var d_ip=new IPv4(deviceWanIp);
                                            var d_subip=new Subnet(deviceSubnetmask);
                                            var d_iface=new IPv4Interface(d_ip.raw()+d_subip.toSlash());
                                            var d_startIp=d_iface.network();
                                            var d_endIp=d_iface.broadcast();                                            
                                            
                                            var startIp2=ipv4interface.network();
                                            var endIp2=ipv4interface.broadcast();
                                            
                                            var x1=d_startIp;
                                            var x2=d_endIp;
                                            var y1=startIp2;
                                            var y2=endIp2;
                                            
                                            if((x1.gte(y1) && x1.lte(y2)) || (x2.gte(y1) && x2.lte(y2)) || (y1.gte(x1) && y1.lte(x2)) || (y2.gte(x1) && y2.lte(x2))){
                                                anyerror=true;
                                                for(var i=0;i<values.length;i++){
                                                    if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_gateway_"+bridge["id"]){
                                                        values[i]['error']=true;
                                                    }
                                                    if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_subnet_"+bridge["id"]){
                                                        values[i]['error']=true;
                                                    }
                                                    if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_addr_start_"+bridge["id"]){
                                                        values[i]['error']=true;
                                                    }
                                                    if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_addr_end_"+bridge["id"]){
                                                        values[i]['error']=true;
                                                    }
                                                }
                                                $("#tcpipTable .errorDhcpMsg").html("The gateway ip is in conflict with a DHCP Server configuration");
                                                if(tcpsectionvalues!=null){
                                                    for(var i=0;i<tcpsectionvalues.length;i++){
                                                        if(tcpsectionvalues[i]['identifier']!=null && tcpsectionvalues[i]['identifier']=="f_tcp_ip"){
                                                            tcpsectionvalues[i]['error']=true;
                                                        }
                                                    }
                                                }
                                                else{
                                                    tcpsectionvalues=new Array();
                                                    var statustcp=new Array();
                                                    statustcp['identifier']="f_tcp_ip";
                                                    statustcp['error']=true;
                                                    statustcp['modified']=false;
                                                    tcpsectionvalues.push(statustcp);
                                                }
                                                $("#dhcp_sub_"+bridge["id"]+" .errorDhcpMsg").html("The gateway ip is in conflict with current device TCP/IP configuration");
                                            }
                                            else{
                                                if(tcpsectionvalues==null){
                                                    tcpsectionvalues=new Array();
                                                    var ip_address=$("#f_tcp_ip").attr("value");
                                                    var statustcp=new Array();
                                                    statustcp['identifier']="f_tcp_ip";
                                                    statustcp['error']=false;
                                                     if(isBlankOrNull(ip_address)|| !isValidIp(ip_address) || ip_address.length<2 || ip_address.lenght>30){
                                                        statustcp['error']=true;
                                                    }
                                                    statustcp['modified']=false;
                                                    tcpsectionvalues.push(statustcp);
                                                    
                                                    var configure_ip=$("#m_tcp_dhcp").attr("value");
                                                    status=new Array();
                                                    status['identifier']="m_tcp_dhcp";
                                                    status['error']=false;
                                                    status['modified']=false;
                                                    if(isBlankOrNull(configure_ip)){
                                                        status['error']=true;
                                                    }
                                                    if(cur_values['m_tcp_dhcp']!=configure_ip){
                                                        status['modified']=true;
                                                    }
                                                    tcpsectionvalues.push(status);
                                                }
                                            }                                            
                                        }catch(err){
                                            console.log("Catched error:"+err);
                                        }
                                    }
                                    
                                }
                            }
                        }
                    }
                }
            }
            if(!anyerrorCrossDhcp){
                for (var bridge_n2 in bridges) {   
                    var bridge2=bridges[bridge_n2];
                    if(bridge["id"]==bridge2["id"] || bridge2["type"]!='bridge_nat'){
                        continue;
                    }
                    var gip=new IPv4($("#dhcp_gateway_"+bridge["id"]).attr("value"));
                    var sip=new Subnet($("#dhcp_subnet_"+bridge["id"]).attr("value"));
                    var iface=new IPv4Interface(gip.raw()+sip.toSlash());
                    var startIp=iface.network();
                    var endIp=iface.broadcast();
                    if(debug_tcp){
                        console.log("First range:"+startIp.toString()+"-"+endIp.toString()); 
                    }
                    var gip2=new IPv4($("#dhcp_gateway_"+bridge2["id"]).attr("value"));
                    var sip2=new Subnet($("#dhcp_subnet_"+bridge2["id"]).attr("value"));
                    var iface2=new IPv4Interface(gip2.raw()+sip2.toSlash());
                    var startIp2=iface2.network();
                    var endIp2=iface2.broadcast();
                    if(debug_tcp){
                         console.log("Second range:"+startIp2.toString()+"-"+endIp2.toString()); 
                    }
                
                    var x1=startIp;
                    var x2=endIp;
                    var y1=startIp2;
                    var y2=endIp2;
                    if((x1.gte(y1) && x1.lte(y2)) || (x2.gte(y1) && x2.lte(y2)) || (y1.gte(x1) && y1.lte(x2)) || (y2.gte(x1) && y2.lte(x2))){
                        for(var i=0;i<values.length;i++){
                            if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_gateway_"+bridge["id"]){
                                values[i]['error']=true;
                            }
                            if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_subnet_"+bridge["id"]){
                                values[i]['error']=true;
                            }
                            if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_addr_start_"+bridge["id"]){
                                values[i]['error']=true;
                            }
                            if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_addr_end_"+bridge["id"]){
                                values[i]['error']=true;
                            }
                            if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_gateway_"+bridge2["id"]){
                                values[i]['error']=true;
                            }
                            if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_subnet_"+bridge2["id"]){
                                values[i]['error']=true;
                            }
                            if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_addr_start_"+bridge2["id"]){
                                values[i]['error']=true;
                            }
                            if(values[i]['identifier']!=null && values[i]['identifier']=="dhcp_addr_end_"+bridge2["id"]){
                                values[i]['error']=true;
                            }
                        }
                        $("#dhcp_sub_"+bridge["id"]+" .errorDhcpMsg").html("Conflict with other DHCP Server Configuration");
                        $("#dhcp_sub_"+bridge2["id"]+" .errorDhcpMsg").html("Conflict with other DHCP Server Configuration");                        
                    }                
                }
            }
            
        }
        /**
        * Check if there is a vlan id duplication
        */
        if(bridge["type"]=="bridge_vlan"){
            var vlan_id_input=$("#dd_vlan_value_"+bridge["id"]).attr("value");
            if(!isAlreadyPresent("dd_vlan_value_"+bridge["id"], values)){
                status=new Array();
                status['identifier']="dd_vlan_value_"+bridge["id"];
                status['error']=false;
                status['modified']=false;
                if(isBlankOrNull(vlan_id_input) || !isValidPositiveNumber(vlan_id_input) || parseInt(vlan_id_input)<2 || parseInt(vlan_id_input)>4094){
                    status['error']=true;
                }
                else{
                    var vlancouter=0;
                    for (var bridge_n2 in bridges) {
                        if(bridge["id"]!=bridges[bridge_n2]["id"] && bridges[bridge_n2]["type"]=="bridge_vlan"){
                            if(vlan_id_input==bridges[bridge_n2]["vlan_id"]){
                                /*if(!isAlreadyPresent("dd_vlan_value_"+bridges[bridge_n2]["id"], values)){
                                    var status2=new Array();
                                    status2['identifier']="dd_vlan_value_"+bridges[bridge_n2]["id"];
                                    status2['error']=true;
                                    status2['modified']=false;
                                    values.push(status2);*/
                                vlancouter++;
                                
                            }
                        }
                    }
                    if(vlancouter>0){
                        status['error']=true;
                    }
                }
                values.push(status);
            }
        }
    }
    var res=dd_checkCaptive();
    if(res!=null){
        status=new Array();
        status['identifier']=res;
        status['error']=true;
        status['modified']=false;
        values.push(status);
    }
    if(isBridgeOrGroupConfigurationChanged()){
        status=new Array();
        status['identifier']="overall"+bridge["id"];
        status['error']=false;
        status['modified']=true;
        values.push(status);
    }
    //console.log(values);
    updateLayoutForValidation(values,4);
    if(tcpsectionvalues!=null){
        updateLayoutForValidation(tcpsectionvalues,5);
    }
}
function isBridgeConfigurationChanged(){
    var start=jQuery.parseJSON( start_bridge_configuration );
    var end=jQuery.parseJSON( dd_getBridgeConfiguration() );
    for (var chiave in start) {  
        var obj=start[chiave];
        var found=false;
        var chiave2=null;
        for (chiave2 in end) {
            if(end[chiave2]["id"]==obj["id"]){
                found=true;
                break;
            }
        }
        if(found){
            if(debug_tcp){
                console.log("isBridgeConfigurationChanged id found"); 
            }
            if(end[chiave2]["type"]!=obj["type"]){
                return true;
            }else{
                if(end[chiave2]["type"]=="bridge_nat"){
                    if(end[chiave2]["dhcp"]["gateway"]!=obj["dhcp"]["gateway"] ||
                        end[chiave2]["dhcp"]["subnet"]!=obj["dhcp"]["subnet"] ||
                        end[chiave2]["dhcp"]["start_address"]!=obj["dhcp"]["start_address"]  ||
                        end[chiave2]["dhcp"]["end_address"]!=obj["dhcp"]["end_address"]  ||
                        end[chiave2]["dhcp"]["lease"]!=obj["dhcp"]["lease"] ||
                        end[chiave2]["dhcp"]["dns1"]!=obj["dhcp"]["dns1"] ||
                        end[chiave2]["dhcp"]["dns2"]!=obj["dhcp"]["dns2"] ||
                        end[chiave2]["dhcp"]["domain"]!=obj["dhcp"]["domain"] ||
                        end[chiave2]["dhcp"]["isolate"]!=obj["dhcp"]["isolate"]){
                        if(debug_tcp){
                            console.log("DHCP Change"); 
                        }
                        return true;
                    }else{
                        if(debug_tcp){
                            console.log("DHCP did not change"); 
                        }
                    }
                } else{
                    if(end[chiave2]["type"]=="bridge_vlan"){
                        if(debug_tcp){
                            console.log("Vlan"); 
                        }
                        if(end[chiave2]["vlan_id"]!=obj["vlan_id"]){
                            if(debug_tcp){
                                console.log("Vlan Change"); 
                            }
                            return true;
                        }else{
                            if(debug_tcp){
                                console.log("Vlan did not change"); 
                            }
                        }
                    }
                }
            }
        }
        else{
            if(debug_tcp){
                console.log("isBridgeConfigurationChanged id not found"); 
            }
            return true;
        }
    } 
    
    start=jQuery.parseJSON( dd_getBridgeConfiguration() );
    end=jQuery.parseJSON( start_bridge_configuration  );
    result=false;
    for (var chiave in start) {  
        var obj2=start[chiave];
        var found3=false;
        var chiave4=null;
        for (chiave4 in end) {
            if(end[chiave4]["id"]==obj2["id"]){
                found3=true;
                break;
            }
        }
        if(found3){
            if(debug_tcp){
                console.log("isBridgeConfigurationChanged-2 id found"); 
            }
            if(end[chiave4]["type"]!=obj2["type"]){
               
                return true;
            }else{
                if(end[chiave4]["type"]=="bridge_nat"){
                    if(end[chiave4]["dhcp"]["gateway"]!=obj2["dhcp"]["gateway"] ||
                        end[chiave4]["dhcp"]["subnet"]!=obj2["dhcp"]["subnet"] ||
                        end[chiave4]["dhcp"]["start_address"]!=obj2["dhcp"]["start_address"]  ||
                        end[chiave4]["dhcp"]["end_address"]!=obj2["dhcp"]["end_address"]  ||
                        end[chiave4]["dhcp"]["lease"]!=obj2["dhcp"]["lease"] ||
                        end[chiave4]["dhcp"]["dns1"]!=obj2["dhcp"]["dns1"] ||
                        end[chiave4]["dhcp"]["dns2"]!=obj2["dhcp"]["dns2"] ||
                        end[chiave4]["dhcp"]["domain"]!=obj2["dhcp"]["domain"] ||
                        end[chiave4]["dhcp"]["isolate"]!=obj2["dhcp"]["isolate"]){
                        if(debug_tcp){
                            console.log("DHCP2 Change"); 
                        }
                        return true;
                    }else{
                        if(debug_tcp){
                            console.log("DHCP2 did not change"); 
                        }
                    }
                } else{
                    if(end[chiave4]["type"]=="bridge_vlan"){
                        if(debug_tcp){
                            console.log("Vlan2"); 
                        }
                        if(end[chiave4]["vlan_id"]!=obj2["vlan_id"]){
                            if(debug_tcp){
                                console.log("Vlan2 Change"); 
                            }
                            return true;
                        }
                        else{
                            if(debug_tcp){
                                console.log("Vlan2 did not change"); 
                            }
                        }
                    }
                }
            }
        }
        else{
            if(debug_tcp){
                console.log("isBridgeConfigurationChanged-2 id not found"); 
            }
            return true;
        }
    } 
    return false
}
function isGroupConfigurationChanged(){
    var start=jQuery.parseJSON( start_interface_configuration );
    var end=jQuery.parseJSON( dd_getInterfaceConfiguration() );
    var obj=null;
    var found=false;
    var chiave2=null;
    var chiave5=null;
    for (var chiave in start) {  
        obj=start[chiave];
        found=false;        
        for (chiave2 in end) {
            if(end[chiave2]["id"]==obj["id"]){
                found=true;
                break;
            }
        }
        if(obj["enabled"]==true && obj["todelete"]==false){
            if(!found){
                if(debug_tcp){
                    console.log("interface not found or not enabled"); 
                }
                return true;
            }
            else{
                if(end[chiave2]["enabled"]==false || end[chiave2]["todelete"]==true){
                    if(debug_tcp){
                        console.log("interface not enabled on end"); 
                    }
                    return true;
                }
                else{
                    if(end[chiave2]["group"]!=obj["group"]){
                        return true;
                    }
                }
            }
        }
    }
    
    start=jQuery.parseJSON( dd_getInterfaceConfiguration() );
    end=jQuery.parseJSON( start_interface_configuration );
    for (var chiave4 in start) {  
        obj=start[chiave4];
        found=false;        
        for (chiave5 in end) {
            if(end[chiave5]["id"]==obj["id"]){
                found=true;
                break;
            }
        }
        if(obj["enabled"]==true && obj["todelete"]==false){
            if(!found){
                if(debug_tcp){
                    console.log("interface not found or not enabled"); 
                }
                return true;
            }
            else{
                if(end[chiave5]["enabled"]==false || end[chiave5]["todelete"]==true){
                    if(debug_tcp){
                        console.log("interface not enabled on end"); 
                    }
                    return true;
                }
            }
        }
    }
    
    return false;
//return start_interface_configuration!=dd_getInterfaceConfiguration();
}
function isBridgeOrGroupConfigurationChanged(){
    if(debug_tcp){
        console.log("Start Bridge Configuration");
        console.log(start_bridge_configuration); 
        console.log("End Bridge Configuration");
        console.log(dd_getBridgeConfiguration());
        console.log("Start Interface Configuration");
        console.log(start_interface_configuration); 
        console.log("End Interface Configuration");
        console.log(dd_getInterfaceConfiguration());
    }
    return isBridgeConfigurationChanged() || isGroupConfigurationChanged();
//return start_bridge_configuration!=dd_getBridgeConfiguration() || start_interface_configuration!=dd_getInterfaceConfiguration();
}
function isAlreadyPresent(identifier,array){
    for(var i=0;i<array.length;i++){
        if(array[i]["identifier"]==identifier){
            return true;
        }
    }
    return false;
}
function dd_updateDhcpValue(element){
    var eid=element.id;
    var value="";
    if(eid.indexOf("dhcp_gateway") != -1){
        value=eid.substring("dhcp_gateway_".length);
        dd_getBridgeById(value)["dhcp"]["gateway"]=element.value;
    }
    if(eid.indexOf("dhcp_subnet") != -1){
        value=eid.substring("dhcp_subnet_".length);
        dd_getBridgeById(value)["dhcp"]["subnet"]=element.value;
    }
    if(eid.indexOf("dhcp_addr_start") != -1){
        value=eid.substring("dhcp_addr_start_".length);
        dd_getBridgeById(value)["dhcp"]["start_address"]=element.value;
    }
    if(eid.indexOf("dhcp_addr_end") != -1){
        value=eid.substring("dhcp_addr_end_".length);
        dd_getBridgeById(value)["dhcp"]["end_address"]=element.value;
    }
    if(eid.indexOf("dhcp_lease") != -1){
        value=eid.substring("dhcp_lease_".length);
        dd_getBridgeById(value)["dhcp"]["lease"]=element.value;
    }
    if(eid.indexOf("dhcp_dns1") != -1){
        value=eid.substring("dhcp_dns1_".length);
        dd_getBridgeById(value)["dhcp"]["dns1"]=element.value;
    }
    if(eid.indexOf("dhcp_dns2") != -1){
        value=eid.substring("dhcp_dns2_".length);
        dd_getBridgeById(value)["dhcp"]["dns2"]=element.value;
    }
    if(eid.indexOf("dhcp_domain") != -1){
        value=eid.substring("dhcp_domain_".length);
        dd_getBridgeById(value)["dhcp"]["domain"]=element.value;
    }
    if(eid.indexOf("dhcp_isolate") != -1){
        value=eid.substring("dhcp_isolate_".length);
        if($(element).is(':checked')){
            dd_getBridgeById(value)["dhcp"]["isolate"]="1";
        }
        else{
            dd_getBridgeById(value)["dhcp"]["isolate"]="";
        }
    }
    internetConnectionSectionValidation();
}
function dd_updateVlanValue(element){
    var eid=element.id;
    var value="";
    if(eid.indexOf("dd_vlan_value_") != -1){
        value=eid.substring("dd_vlan_value_".length);
        dd_getBridgeById(value)["vlan_id"]=element.value;
        dd_getBridgeById(value)["display"]= "Bridged with WAN and tagged with VLAN "+element.value;
    }
    internetConnectionSectionValidation();
}
function dd_getBridgeConfiguration(){
    return JSON.stringify(bridges);
}
function dd_getInterfaceConfiguration(){
    return JSON.stringify(interfaces);
}

function dd_checkCaptive(){
    var captives=new Array();
    for (var ro in bridges) {
        if(debug_tcp){
            console.log(bridges[ro]);
        }
    }
    for (var ro in rows_ssid) {
        if(rows_ssid[ro]["auth_1"]=="Captive Portal" && rows_ssid[ro]["ssid_on"]==true && rows_ssid[ro]["status"]==0){
            if(debug_tcp){
                console.log(rows_ssid[ro]);
            }	
            captives.push(rows_ssid[ro]["ssid1"]);            
        }
    }
    if(captives.length==0){
        return null;
    }
    if(captives.length>1){
        alert("Only one ssid configured as captive portal can be activated");
    }
    for (var ii in interfaces) {
        if(interfaces[ii]["display"]==captives[0]){
            if(debug_tcp){
                console.log(interfaces[ii]);
            }
            var selgroup=interfaces[ii]["group"];
            if(bridges[selgroup]["type"]!="bridge_nat"){
                //alert("Please put SSID "+interfaces[ii]["display"]+" in a nat group: Internet Connection -> Drag the SSID over an existing NAT group or create a new one ");
                return "ssid_"+interfaces[ii]["id"];
            }
        }
    }
    return null;
}

function carretReader(event,element){
    var val=$(element).attr("value");
    var range=getInputSelection(element);
    var multiplier=1;
    if(event.keyCode==38){
        if(!isBlankOrNull(val) && isValidIp(val)){
            try{
                var firstCount=countInstances(val.substring(0,range.start),".");
                switch(firstCount){
                    case 0:
                        multiplier= 256*256*256;
                        break;
                    case 1:
                        multiplier= 256*256;
                        break;
                    case 2:
                        multiplier= 256;
                        break;
                    case 3:
                        multiplier= 1;
                        break;
                    default:
                        multiplier= 1;
                }
                var ipval=new IPv4(val);
                if(!ipval.equals(new IPv4("255.255.255.255"))){
                    $(element).attr("value",ipval.add(multiplier));
                    setCaretPosition(element.id,range.start);
                    range=getInputSelection(element);                    
                }
            }catch(err){
                console.log(err);
            }
        }
    }
    else{
        if(event.keyCode==40){
            if(!isBlankOrNull(val) && isValidIp(val)){
                try{
                    var firstCount=countInstances(val.substring(0,range.start),".");
                    switch(firstCount){
                        case 0:
                            multiplier= 256*256*256;
                            break;
                        case 1:
                            multiplier= 256*256;
                            break;
                        case 2:
                            multiplier= 256;
                            break;
                        case 3:
                            multiplier= 1;
                            break;
                        default:
                            multiplier= 1;
                    }
                    var ipval=new IPv4(val);
                    if(!ipval.equals(new IPv4("0.0.0.0"))){
                        $(element).attr("value",ipval.minus(multiplier));
                        setCaretPosition(element.id,range.start);
                        var secondCount=countInstances($(element).attr("value").substring(0,range.start),".");
                        if(firstCount!=secondCount){
                            console.log("Repositioning carret");
                            setCaretPosition(element.id,range.start-1);
                        }
                    }
                }catch(err){
                    console.log(err);
                }
            }
        }
    }
}
function countInstances(string, word) {
   var substrings = string.split(word);
   return substrings.length - 1;
}

function setCaretPosition(elemId, caretPos) {
    var elem = document.getElementById(elemId);

    if(elem != null) {
        if(elem.createTextRange) {
            var range = elem.createTextRange();
            range.move('character', caretPos);
            range.select();
        }
        else {
            if(elem.selectionStart) {
                elem.focus();
                elem.setSelectionRange(caretPos, caretPos);
            }
            else
                elem.focus();
        }
    }
}
function getInputSelection(el) {
    var start = 0, end = 0, normalizedValue, range,
        textInputRange, len, endRange;

    if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
        start = el.selectionStart;
        end = el.selectionEnd;
    } else {
        range = document.selection.createRange();

        if (range && range.parentElement() == el) {
            len = el.value.length;
            normalizedValue = el.value.replace(/\r\n/g, "\n");

            // Create a working TextRange that lives only in the input
            textInputRange = el.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());

            // Check if the start and end of the selection are at the very end
            // of the input, since moveStart/moveEnd doesn't return what we want
            // in those cases
            endRange = el.createTextRange();
            endRange.collapse(false);

            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                start = end = len;
            } else {
                start = -textInputRange.moveStart("character", -len);
                start += normalizedValue.slice(0, start).split("\n").length - 1;

                if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                    end = len;
                } else {
                    end = -textInputRange.moveEnd("character", -len);
                    end += normalizedValue.slice(0, end).split("\n").length - 1;
                }
            }
        }
    }

    return {
        start: start,
        end: end
    };
}