function dashboard_addNetwork() {
    showSecondaryMenu("3","0",false);
    loadPage("3-0","wizard=true&returnTo=dashboard");
}
function dashboard_selectNetwork(elementId,id){
    //displayNetworkDb(id);
    loadPage("ajaxLoadDashboardNetworkSelection","id="+id,"noUI");
    $("#networkDash"+elementId).parent().parent().children().children().removeClass("selectedElement");
    $("#networkDash"+elementId).addClass("selectedElement");
    showNetworkDbIcons(id);
}
function dashboard_monitorNetwork(id){
    showSecondaryMenu("1","0",false);
    loadPage("1-0","network="+id);
}
function dashboard_configureNetwork(id){
    showSecondaryMenu("2","0",false);
    loadPage("2-0","network="+id);
}
function dashboard_createDisplay(id){
    
    var contentString = "<div style='min-width:260px'><p class='googleMsg' style='white-space:nowrap'>" + markersAssDb[id].labelContent+ "</p>";
    contentString = contentString
    + "<table style='min-width:100%'><tr>"
    + "<td align='center'><div id=\"settings_bttn\" class=\"bttn bttn_red\" style=\"width:90px;float:none\"><a href=\"#\" onclick=\"monitor_showApStats('"
    + id
    + "')\"/>Show Stats</a><span></span></div> </td><td><div id=\"settings_bttn\" style=\"min-width:130px\" class=\"bttn bttn_red\"><a id=\"cancelLanButton\" href=\"#\" onclick=\"configure_accessPoint_settings('"
    + id
    + "')\"/>Change Settings</a><span></span></div></td></tr></table></div>"
                    
    return contentString;
}
function showDashboard(show){
    /*if(show!=null && show==true){
        //$("#tabs_0").css("visibility","visible");
        //$("#titleText").css("visibility","visible");
        $("#tabs_0").css("display","");
        $("#titleText").css("display","");
        $("#dashboardTd").css("width","530px");
        $("#dashboardTd").css("display","");
    }
    else{
        //$("#tabs_0").css("visibility","hidden");
        //$("#titleText").css("visibility","hidden");        
         
        $("#tabs_0").css("display","none");
        $("#titleText").css("display","none");
        $("#dashboardTd").css("width","0px");
        $("#dashboardTd").css("display","none");
    }*/
}
function dashboard_updateDashboardOverview(random){
    requestUri = "action=ajaxLoadApStatusAll";
    executeAjaxRequest("index.php?", requestUri,
        // success
        function(data) {
            if (stopExecution(data)) {
                return;
            }
            if($("#ajaxLoadDashboardOverview"+random).attr("value")!="true"){
                //alert("stopping");
                return;
            }
            if(data!=null && data.aps!=null){
                //updateLeftMenuApStatus(data.aps);
                updateMapApDbStatus(data.aps);
            }
            timer=setTimeout("dashboard_updateDashboardOverview('"+random+"')",2000);            
            updateMainSize();
        },
        // beforeSend
        function(xhr) {
            cleanTimers();
        },null,false);
}
function dashboard_retryDashboard(random,loadpage){
    if(dashboard_random!=random){
        return;
    }
    if($("#main")!=null && $("#main").length>0){
        if(loadpage){
            loadPage('ajaxLoadStartPage','',"withMenu");
        }
    }
    else{
        cleanTimers();
        timer=setTimeout("dashboard_retryDashboard("+random+","+(loadpage?"true":"false")+")",1000);
    }
}
function dashboard_retryDashboard_demosetup(random,loadpage){
    if(dashboard_random!=random){
        return;
    }
    if($("#main")!=null && $("#main").length>0){
        if(loadpage){
            loadPage('ajaxLoadStartPageDemoSetup','',"fullPage");
        }
    }
    else{
        cleanTimers();
        timer=setTimeout("dashboard_retryDashboard_demosetup("+random+","+(loadpage?"true":"false")+")",1000);
    }
}
function demosetup_checkPendingRevision(userid,random){
    requestUri = "action=ajaxLoadConfigure_demoSetup_checkPendingRev&id="+userid;
    executeAjaxRequest("index.php?", requestUri,
        // success
        function(data) {
            if (stopExecution(data)) {
                return;
            }
            if(data.status=="ok"){
                window.location.href='/';
            }
            else{
                timer=setTimeout("demosetup_checkPendingRevision("+userid+","+random+")",2000);
            }
        },
        // beforeSend
        function(xhr) {
            if(timer!=null){
                clearTimeout(timer);
            }
            if(tztimer!=null){
                clearTimeout(tztimer);
            }
        },null,false);
}

/**
 * NEW DASHBOARD
 */
var WIDGET_TYPE_SUMMARY=0;
var WIDGET_TYPE_LAST_EMAIL=1;
var WIDGET_TYPE_FIRMWARE_UPGRADE=2;
var WIDGET_TYPE_NETWORK_STATUS=3;
var WIDGET_TYPE_OFFLINE_MAP=4;
var WIDGET_ID_PREFIX="tzwidget_component_";
var widgetsData=new Array();
var widgetDashboardRandom=0;

var dashboardTimer=null;
var firstDashBoardLoad=true;

function tzwidgetUpdateDashboard(ids){  
    //console.log("tzwidgetUpdateDashboard");
    clearTimeout(dashboardTimer);    
    if($("#ajaxLoadDashboardWidget"+widgetDashboardRandom).attr("value")!="true"){            
        console.log("Leaving Dashboard");
        return;
    }
    var params= "action=ajaxLoadDashboardWidget&"; 
    params+="wdr="+widgetDashboardRandom+"&";
    var split=ids.split(";");
    var widgets="widgets=";
    for(var p=0;p<split.length;p++){          
        id=split[p];
        if(id!=""){
            widgets+=id+";";
            var widget=tzwidgetGetWidgetObject(id);
            params+="widget_"+widget.id+"_type="+widget.type+"&";
            if(widget.data!=null){
                params+="widget_"+widget.id+"_data="+encodeURI(widget.data)+"&";
            }
            if(!firstDashBoardLoad){
                params+="widget_"+widget.id+"_pref="+(tzwidgetIsWidgetCollapsed(widget.id)?"true":"false")+"&";
            }
            tzwidgetLoading(id);
        }
    }
    params+=widgets;
    if(firstDashBoardLoad){
        params+="&s=t";
        firstDashBoardLoad=false;
    }
    $.post(getServer()+"index.php?", params, function(data) {
        if(stopExecutionNoHistory(data)){            
            return;
        }
        //console.log("Received widget update:"+data);
        if($("#ajaxLoadDashboardWidget"+data.wdr).attr("value")!="true" || !$("#dashboardContainer").is(":visible")){            
            console.log("Leaving Dashboard");
            return;
        }
        var widgets=data.widgets;
        if(widgets==null){
            //console.log("Received empty widgets string, aborting");            
            return;
        }
        widgets=widgets.split(";");
        for(var wt=0;wt<widgets.length;wt++){
            var wid=widgets[wt];            
            if(wid!=""){
                eval("wid=data.widget_"+wid+";");
                var widgetType=parseInt(wid.type);
                switch(widgetType){
                    case WIDGET_TYPE_SUMMARY:
                        tzwidgetUpdateSummaryWidget(wid);
                        break;
                    case WIDGET_TYPE_FIRMWARE_UPGRADE:
                        tzwidgetUpdateFirmwareUpgrade(wid);
                        break;
                    case WIDGET_TYPE_NETWORK_STATUS:
                        tzwidgetUpdateNewtorkStatus(wid);
                        break;
                    case WIDGET_TYPE_OFFLINE_MAP:
                        tzwidgetUpdateOfflineMap(wid);
                        break;
                }            
                tzwidgetDataSectionReady(widgets[wt]);
            }
        }
        updateMainSize();
        dashboardTimer=setTimeout(function(){tzwidgetUpdateDashboard(ids)}, 10000 );
    },'jsonp');
}
function tzwidgetUpdateSummaryWidget(wid){
    var htmlobj=tzwidgetGetHTMLWidgetObject(wid.id);
    htmlobj.find(".tzwidget_summary_apnumbers_online").html(wid.apnumbers_online);
    htmlobj.find(".tzwidget_summary_apnumbers_total").html(wid.apnumbers_total);
    htmlobj.find(".tzwidget_summary_netnumbers_ok").html(wid.netnumbers_online);
    htmlobj.find(".tzwidget_summary_netnumbers_total").html(wid.netnumbers_total);
    if(wid.apnumbers_online!=wid.apnumbers_total){
        htmlobj.removeClass("panel-success");
        htmlobj.addClass("panel-danger");
        
        htmlobj.find(".tzwidget_summary_apnumbers").addClass("text-danger").removeClass("text-success");
        htmlobj.find(".tzwidget_summary_apnumbers_online").addClass("text-danger").removeClass("text-success");
        htmlobj.find(".tzwidget_summary_apnumbers_total").addClass("text-danger").removeClass("text-success");
        
        htmlobj.find(".tzwidget_summary_netnumbers").addClass("text-danger").removeClass("text-success");
        htmlobj.find(".tzwidget_summary_netnumbers_ok").addClass("text-danger").removeClass("text-success");
        htmlobj.find(".tzwidget_summary_netnumbers_total").addClass("text-danger").removeClass("text-success");
        
    }
    else{
        if(wid.apnumbers_total!=0){
            htmlobj.addClass("panel-success");
            htmlobj.removeClass("panel-danger");
        
            htmlobj.find(".tzwidget_summary_apnumbers").removeClass("text-danger").addClass("text-success");
            htmlobj.find(".tzwidget_summary_apnumbers_online").removeClass("text-danger").addClass("text-success");
            htmlobj.find(".tzwidget_summary_apnumbers_total").removeClass("text-danger").addClass("text-success");
            
            htmlobj.find(".tzwidget_summary_netnumbers").removeClass("text-danger").addClass("text-success");
            htmlobj.find(".tzwidget_summary_netnumbers_ok").removeClass("text-danger").addClass("text-success");
            htmlobj.find(".tzwidget_summary_netnumbers_total").removeClass("text-danger").addClass("text-success");
        
        }
        else{
            
            
            htmlobj.removeClass("panel-danger").removeClass("panel-success");
        
            htmlobj.find(".tzwidget_summary_apnumbers").removeClass("text-danger").removeClass("text-success");
            htmlobj.find(".tzwidget_summary_apnumbers_online").removeClass("text-danger").removeClass("text-success");
            htmlobj.find(".tzwidget_summary_apnumbers_total").removeClass("text-danger").removeClass("text-success");
            
            htmlobj.find(".tzwidget_summary_netnumbers").removeClass("text-danger").removeClass("text-success");
            htmlobj.find(".tzwidget_summary_netnumbers_ok").removeClass("text-danger").removeClass("text-success");
            htmlobj.find(".tzwidget_summary_netnumbers_total").removeClass("text-danger").removeClass("text-success");
        
        }        
    }
    if(wid.apnumbers_total==0){
        htmlobj.find(".tzwidget_summary_allonline").hide();
        htmlobj.find(".tzwidget_summary_offline").hide();
    }
    else{
        if(wid.apnumbers_online!=wid.apnumbers_total){
            //update offline devices table
            htmlobj.find(".tzwidget_summary_allonline").hide();
            htmlobj.find(".tzwidget_summary_offline").show();
            
            var table=htmlobj.find(".tzwidget_summary_offline tbody").html("");
            if(wid.aps!=null){
                for(var k=0;k<wid.aps.length;k++){
                    var ap=wid.aps[k];
                    var row="<tr><td><img title=\"{{ title_status }}\" src=\"static/images/status_ap_{{ status }}.png\"/></td><td title=\"{{ title_network }}\" onclick=\"configure_changeNetwork_new('overview',{{ network_id }})\" class=\"entitylabel\">{{ network_label }}</td><td  class=\"entitylabel\" onclick=\"configure_accessPoint_settings('{{ ap_id }}')\" title=\"{{ title_ap }}\">{{ ap_label }}</td><td>{{ timestamp }}</td></tr>";
                    row=row.replace("{{ network_id }}", ap.network_id);
                    row=row.replace("{{ network_label }}", ap.network_label);
                    row=row.replace("{{ title_network }}", ap.network_label);
                    row=row.replace("{{ ap_id }}", ap.ap_id);
                    row=row.replace("{{ ap_label }}", ap.ap_label);
                    row=row.replace("{{ title_ap }}", ap.network_label);
                    row=row.replace("{{ title }}", ap.ap_label);
                    var age="";
                    if(ap.lastupdate!=-1){
                        var tmp = parseInt(wid.serverTimestamp- ap.lastupdate/1000);
                        age=extractTextFromSecondsTruncated(tmp)+ " ago";
                    }   
                    else{
                        age="N/A";
                    }
                    row=row.replace("{{ timestamp }}", age);
                    if(ap.status=="online"){
                        row=row.replace("{{ status }}", "ok");
                        row=row.replace("{{ title_status }}", "Online");
                    }
                    else{
                        if(ap.status=="alert"){
                            row=row.replace("{{ status }}", "problem");
                            row=row.replace("{{ title_status }}", "Recently went offline");
                            
                        }
                        else{
                            row=row.replace("{{ status }}", "offline");
                            row=row.replace("{{ title_status }}", "Offline");
                        }
                    }
                    table.append(row);
                }
            }
        }
        else{
            //show message that all aps are up and running
            htmlobj.find(".tzwidget_summary_allonline").show();
            htmlobj.find(".tzwidget_summary_offline").hide();
        }
    }
    if(wid.collapse!=null){
        if(wid.collapse){                
            htmlobj.find(".panel-collapse :first").collapse('hide');
        }
        else{
            htmlobj.find(".panel-collapse :first").collapse('show');
        }
    }
}
function tzwidgetUpdateFirmwareUpgrade(wid){
    var htmlobj=tzwidgetGetHTMLWidgetObject(wid.id);
    if(wid.upgrades<=0){
        htmlobj.addClass("panel-default").removeClass("panel-warning");
        htmlobj.find(".tzwidget_firmwareupdates_allok").show();
        htmlobj.find(".tzwidget_firmwareupdates_toupgrade").hide();
    }
    else{
        htmlobj.addClass("panel-warning").removeClass("panel-default");
        htmlobj.find(".tzwidget_firmwareupdates_allok").hide();
        htmlobj.find(".tzwidget_firmwareupdates_toupgrade").show();
        var table=htmlobj.find(".tzwidget_firmwareupdates_toupgrade tbody").html("");
        if(wid.aps!=null){
            for(var k=0;k<wid.aps.length;k++){
                var ap=wid.aps[k];
                var row="<tr><td><img title=\"{{ title_status }}\" src=\"static/images/status_ap_{{ status }}.png\"/></td><td title=\"{{ title_network }}\" class=\"entitylabel\" onclick=\"configure_changeNetwork_new('overview',{{ network_id }})\">{{ network_label }}</td><td class=\"entitylabel\" title=\"{{ title_ap }}\" onclick=\"configure_accessPoint_settings('{{ ap_id }}')\">{{ ap_label }}</td><td>{{ ap_firmware }}</td><td><button onclick=\"configure_accessPoint_settings('{{ ap_id }}','true')\" {{ upgrade_button }} type=\"button\" class=\"btn btn-primary btn-xs\">Upgrade</button></td></tr>";
                row=row.replace("{{ network_id }}", ap.network_id);
                row=row.replace("{{ network_label }}", ap.network_label);
                row=row.replace("{{ title_network }}", ap.network_label);
                row=row.replace("{{ ap_id }}", ap.ap_id);
                row=row.replace("{{ ap_id }}", ap.ap_id);
                row=row.replace("{{ ap_label }}", ap.ap_label);
                row=row.replace("{{ title_ap }}", ap.ap_label);
                row=row.replace("{{ ap_firmware }}", ap.ap_firmware);
                var age="";
                if(ap.lastupdate!=-1){
                    var tmp = parseInt(wid.serverTimestamp- ap.lastupdate/1000);
                    age=extractTextFromSecondsTruncated(tmp)+ " ago";
                }   
                else{
                    age="N/A";
                }
                row=row.replace("{{ timestamp }}", age);
                if(ap.status=="online"){
                    row=row.replace("{{ status }}", "ok");
                    row=row.replace("{{ title_status }}", "Online");
                    row=row.replace("{{ upgrade_button }}", "");
                }
                else{
                    row=row.replace("{{ upgrade_button }}", " style=\"display:none\" ");
                    if(ap.status=="alert"){
                        row=row.replace("{{ status }}", "problem");
                        row=row.replace("{{ title_status }}", "Recently went offline");

                    }
                    else{
                        row=row.replace("{{ status }}", "offline");
                        row=row.replace("{{ title_status }}", "Offline");
                    }
                }
                table.append(row);
            }
        }
    }
    htmlobj.find(".tzwidget_firmwareupdates_number").html(wid.upgrades);
    if(wid.collapse!=null){
        if(wid.collapse){                
            htmlobj.find(".panel-collapse :first").collapse('hide');
        }
        else{
            htmlobj.find(".panel-collapse :first").collapse('show');
        }
    }
}
function tzwidgetUpdateNewtorkStatus(wid){
    var htmlobj=tzwidgetGetHTMLWidgetObject(wid.id);
    htmlobj.find(".tzwidget_networkstatus_label").html(wid.network_label);  
    if(wid.total==0){
        htmlobj.removeClass("panel-success").removeClass("panel-danger"); 
        htmlobj.find(".tzwidget_networkstatus_badge").hide();
    }
    else{
        if(wid.offline>0){
            htmlobj.find(".tzwidget_networkstatus_badge").html(wid.offline+" offline");
            htmlobj.addClass("panel-danger").removeClass("panel-success");
        }
        else{            
            htmlobj.addClass("panel-success").removeClass("panel-danger");       
            htmlobj.find(".tzwidget_networkstatus_badge").hide();
        }    
    }
    if(wid.total==0){
        htmlobj.find(".tzwidget_networkstatus_aps").hide();
        htmlobj.find(".tzwidget_networkstatus_addap").show();
        htmlobj.find(".tzwidget_networkstatus_addaplink").attr("href","javascript:{configure_changeNetwork_new('overview',"+wid.network_id+")}");
    }
    else{
        htmlobj.find(".tzwidget_networkstatus_aps").show();
        htmlobj.find(".tzwidget_networkstatus_addap").hide();
    }
    var table=htmlobj.find(".tzwidget_networkstatus_aps tbody").html("");
    if(wid.aps!=null){
        for(var k=0;k<wid.aps.length;k++){
            var ap=wid.aps[k];
            var row="<tr><td><img title=\"{{ title_status }}\" src=\"static/images/status_ap_{{ status }}.png\"/></td><td title=\"{{ title_ap }}\" class=\"entitylabel entitylabelXL\" onclick=\"configure_accessPoint_settings('{{ ap_id }}')\">{{ ap_label }}</td><td>{{ timestamp }}</td></tr>";
            row=row.replace("{{ ap_id }}", ap.ap_id);
            row=row.replace("{{ ap_label }}", ap.ap_label);
            row=row.replace("{{ title_ap }}", ap.ap_label);
            var age="";
            if(ap.lastupdate!=-1){
                var tmp = parseInt(wid.serverTimestamp- ap.lastupdate/1000);
                age=extractTextFromSecondsTruncated(tmp)+ " ago";
            }   
            else{
                age="N/A";
            }
            row=row.replace("{{ timestamp }}", age);
            if(ap.status=="online"){
                row=row.replace("{{ status }}", "ok");
                row=row.replace("{{ title_status }}", "Online");
            }
            else{
                if(ap.status=="alert"){
                    row=row.replace("{{ status }}", "problem");
                    row=row.replace("{{ title_status }}", "Recently went offline");

                }
                else{
                    row=row.replace("{{ status }}", "offline");
                    row=row.replace("{{ title_status }}", "Offline");
                }
            }
            table.append(row);
        }
    }
    if(wid.collapse!=null){
        if(wid.collapse){                
            htmlobj.find(".panel-collapse :first").collapse('hide');
        }
        else{
            htmlobj.find(".panel-collapse :first").collapse('show');
        }
    }
}
function tzwidgetUpdateOfflineMap(wid){
    
    var htmlobj=tzwidgetGetHTMLWidgetObject(wid.id);
    htmlobj.find(".tzwidget_offlinemap_number").html(wid.aps!=null?wid.aps.length:"0");  
    var hiddenAps=0;
    if(wid.aps!=null && wid.aps.length>0){
        //intersect values
        var toDelete=new Array();
        var toAdd=new Array();
        var found=false;
        for(var k=0;k<wid.aps.length;k++){
            found=false;
            for (var t in markers ) {
                if(t==wid.aps[k].ap_id){
                    found=true;
                    break;
                }
            }
            if(!found){
               toAdd.push(wid.aps[k].ap_id); 
            }
        }
        for (var t in markers ) {
            found=false;
            for(var k=0;k<wid.aps.length;k++){
                if(t==wid.aps[k].ap_id){
                    found=true;
                    break;
                }
            }
            if(!found){
                toDelete.push(t);
            }
        }
        // hide infocontent if of deleted ap
        if(infowindow!=null && infowindow.apId!=null && $.inArray(infowindow.apId,toDelete)!=-1){
            infowindow.close();
        }
        // delete markers 
        for (var t in markers ) {
            if($.inArray(t,toDelete)!=-1){
                markers[t].setMap(null);
                delete markers[t];
            }            
        }
        
        for(var k=0;k<wid.aps.length;k++){
            if($.inArray(wid.aps[k].ap_id,toAdd)!=-1){
                var lat=wid.aps[k].lat;
                var lng=wid.aps[k].lon;
                var id=wid.aps[k].ap_id;
                var nome=wid.aps[k].ap_label;
                if (lat != null && lng != null) {
                    var latlng = null;
                    // if located on map
                    if (lat!='' && lng!='') {
                        latlng = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
                        if (area == null) {
                            area = new google.maps.LatLngBounds(latlng, latlng);
                        } else {
                            area = area.extend(latlng);
                        }
                        var urlImg="static/images/accessPointGray.png";

                        if(wid.aps[k].status=="online"){
                            urlImg=("static/images/status_ap_ok.png");
                        } 
                        else{
                            if(wid.aps[k].status=="alert"){
                                urlImg=("static/images/status_ap_problem.png");
                            }else{
                                urlImg=("static/images/status_ap_offline.png");
                            }
                        }

                        var marker = new MarkerWithLabel({
                            draggable : false,
                            position : latlng,
                            icon : {
                                    url :urlImg
                            },
                            map : map,
                            labelContent : nome,
                            labelAnchor : new google.maps.Point(20, 0),
                            labelClass : "mapMarker", // the CSS class for the label
                            labelStyle : {
                                    opacity : 0.75
                            }
                        });

                        var contentString = "<div style='min-width:200px'><p class='googleMsg'>"+nome+"</p>";
                        contentString = contentString
                        + "<table style=\"width:100%\"><tr><td style=\"padding-left:20px\"><div id=\"location_bttn\" class=\"bttn bttn_red\" style=\"width:105px\"><a style=\"color:white\" href=\"#\" onclick=\"monitor_showApStats('"
                        + id
                        + "')\"/>Show Stats</a><span></span></div></td>"
                        + "<td><div id=\"settings_bttn\" class=\"bttn bttn_red\" style=\"width:135px\"><a style=\"color:white\" href=\"#\" onclick=\"configure_accessPoint_settings('"
                        + id
                        + "')\"/>Change Settings</a><span></span></div></td></tr></table></div>"
                        marker.tzid=id;
                        marker.content=contentString;
                        google.maps.event.addListener(marker, 'click', function(event) {
                            //console.log("Clicking on "+this.tzid);
                            infowindow.setContent(this.content);
                            infowindow.open(map, this);
                            infowindow.apId=this.tzid;
                        });
                        networks[id] = new Array(id, lat, lng, nome);
                        contatore++;
                        markers[id] = marker;  
                    }
                }
            }
        }
        for(var k=0;k<wid.aps.length;k++){
             var lat=wid.aps[k].lat;
            var lng=wid.aps[k].lon;
            var id=wid.aps[k].ap_id;
            var nome=wid.aps[k].ap_label;
            if (lat != null && lng != null && lat!='' && lng!='') {

            }
            else{
                hiddenAps++;
            }
        }
        var widge=tzwidgetGetWidgetObject(wid.id);
        if(widge.firstZoom==null){
            tzwidgetGetWidgetObject(wid.id).firstZoom=true;
            if(area!=null){
                map.panTo(area.getCenter());
                if(contatore==1){
                    setTimeout("map.fitBounds(area);map.setZoom(7);", 200);
                }
                else{
                    setTimeout("map.fitBounds(area)", 200);
                }
            }            
        }
        //htmlobj.find(".tzwidget_offlinemap_noapimage").hide(); 
        //htmlobj.find("#contenitoreMappa").show(); 
    }else{
        // hide infocontent if of deleted ap
        if(infowindow!=null && infowindow.apId!=null){
            infowindow.close();
        }
        // delete markers 
        for (var t in markers ) {
            markers[t].setMap(null);
            delete markers[t];
        }
        //htmlobj.find(".tzwidget_offlinemap_noapimage").show(); 
        //htmlobj.find("#contenitoreMappa").hide(); 
    }
    if(hiddenAps==0){
       htmlobj.find(".tzwidget_offlinemap_hidden").hide(); 
    }
    else{
       htmlobj.find(".tzwidget_offlinemap_hidden").show();  
    }
    if(wid.collapse!=null){
        if(wid.collapse){                
            htmlobj.find(".panel-collapse :first").collapse('hide');
        }
        else{
            htmlobj.find(".panel-collapse :first").collapse('show');
        }
    }    
}
function tzwidgetIsWidgetCollapsed(widgetid){
    for(var t=0;t<widgetsData.length;t++){
        if(widgetid<=widgetsData[t].id){
            var obj=tzwidgetGetHTMLWidgetObject(widgetsData[t].id);
            return !obj.find(".panel-body").hasClass("in");
        }
    }
    return true;
    
}
function tzwidgetGetNewWidgetId(){
    var newid=-1;
    for(var t=0;t<widgetsData.length;t++){
        if(newid<=widgetsData[t].id){
            newid=widgetsData[t].id;
        }
    }
    newid++;
    return newid;
}
function tzwidgetAddWidget(){
    var wid=new Object();
    wid.id=tzwidgetGetNewWidgetId();
    wid.htmlid=WIDGET_ID_PREFIX+wid.id;
    wid.type=WIDGET_TYPE_SUMMARY;
    wid.timer=null;
}
function tzwidgetGetWidgetObject(id){
    for(var t=0;t<widgetsData.length;t++){
        if(id==widgetsData[t].id){
            return widgetsData[t];
        }
    }
    return null;
}
function tzwidgetGetHTMLWidgetObject(id){
    for(var t=0;t<widgetsData.length;t++){
        if(id==widgetsData[t].id){
            return $("#"+widgetsData[t].htmlid);
        }
    }
    return null;
}
function tzwidgetLoading(id){
    var widget=$("#"+WIDGET_ID_PREFIX+id);
    //widget.find(".tzwidgetLoadingDiv").show();
    widget.find(".tzwidgetLoadingGif").show();
}
function tzwidgetDataSectionReady(id){
    var widget=$("#"+WIDGET_ID_PREFIX+id);
    //widget.find(".tzwidgetLoadingDiv").hide();
    widget.find(".tzwidgetLoadingGif").hide();
}
function tzwidgetIsLoading(id){
    var widget=$("#"+WIDGET_ID_PREFIX+id);
    return widget.find(".tzwidgetLoadingDiv").is(':visible');
}
function tzwidgetLayoutWidgets(){
    var widgs="";
    for(var t=0;t<widgetsData.length;t++){
        widgs+=widgetsData[t].id+";";
        switch(parseInt(widgetsData[t].type+"")){
            case WIDGET_TYPE_SUMMARY:
                var tzwidget_template_summary_t=$("#tzwidget_template_summary").attr("value");
                tzwidget_template_summary_t=tzwidget_template_summary_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_summary_t=tzwidget_template_summary_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_summary_t=tzwidget_template_summary_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_summary_t=tzwidget_template_summary_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_summary_t=tzwidget_template_summary_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_summary_t=tzwidget_template_summary_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_summary_t=tzwidget_template_summary_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_summary_t=tzwidget_template_summary_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_summary_t=tzwidget_template_summary_t.replace("{{ collapse }}",(widgetsData[t].collapse?"collapse":"in"));
                $("#leftDashboard").append(tzwidget_template_summary_t);
                break;
            case WIDGET_TYPE_NETWORK_STATUS:
                var tzwidget_template_network_status_t=$("#tzwidget_template_network_status").attr("value");
                tzwidget_template_network_status_t=tzwidget_template_network_status_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_network_status_t=tzwidget_template_network_status_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_network_status_t=tzwidget_template_network_status_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_network_status_t=tzwidget_template_network_status_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_network_status_t=tzwidget_template_network_status_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_network_status_t=tzwidget_template_network_status_t.replace("{{ collapse }}",(widgetsData[t].collapse?"collapse":"in"));
                $("#rightDashboard").append(tzwidget_template_network_status_t);
                break;
            case WIDGET_TYPE_FIRMWARE_UPGRADE:
                var tzwidget_template_firmware_t=$("#tzwidget_template_firmware").attr("value");
                tzwidget_template_firmware_t=tzwidget_template_firmware_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_firmware_t=tzwidget_template_firmware_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_firmware_t=tzwidget_template_firmware_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_firmware_t=tzwidget_template_firmware_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_firmware_t=tzwidget_template_firmware_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
                tzwidget_template_firmware_t=tzwidget_template_firmware_t.replace("{{ collapse }}",(widgetsData[t].collapse?"collapse":"in"));
                $("#leftDashboard").append(tzwidget_template_firmware_t);
                break;
            case WIDGET_TYPE_OFFLINE_MAP:
                tzwidetLayoutOfflineMap(t,widgetsData);
                break;
        }
    }
    tzwidgetUpdateDashboard(widgs);
}
function tzwidetLayoutOfflineMap(t,widgetsData){
    
    var tzwidget_template_offlinemap_t=$("#tzwidget_template_offlinemap").attr("value");
    tzwidget_template_offlinemap_t=tzwidget_template_offlinemap_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
    tzwidget_template_offlinemap_t=tzwidget_template_offlinemap_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
    tzwidget_template_offlinemap_t=tzwidget_template_offlinemap_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
    tzwidget_template_offlinemap_t=tzwidget_template_offlinemap_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
    tzwidget_template_offlinemap_t=tzwidget_template_offlinemap_t.replace("{{ tzwidgetid }}",widgetsData[t].id);
    tzwidget_template_offlinemap_t=tzwidget_template_offlinemap_t.replace("{{ collapse }}",(widgetsData[t].collapse?"collapse":"in"));
    $("#downDashboard").append(tzwidget_template_offlinemap_t);
    var myOptionsDb = {
        zoom: 1,
        center: new google.maps.LatLng(29.990566,	17.07001),
        disableDefaultUI:false,
        panControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.BIG
        },
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        minZoom :1
    };
    map = new google.maps.Map(document.getElementById("contenitoreMappa"),myOptionsDb);
    google.maps.event.addListener(map, 'maptypeid_changed', function() {
        mapType=map.getMapTypeId();
    });
    if(window.mapType != undefined){
        map.setMapTypeId(mapType);
    }
    var htmlobj=tzwidgetGetHTMLWidgetObject(widgetsData[t].id);

    $(htmlobj).find(".panel-body").on('shown.bs.collapse', function () {
        // do something…
        google.maps.event.trigger(map, 'resize');
        map.fitBounds(area);
    });
    $(htmlobj).find(".panel-body").on('show.bs.collapse', function () {
        updateMainSize();       
    });
    $(htmlobj).find(".panel-body").on('hidden.bs.collapse', function () {
        updateMainSize();       
    });
    resetNetworks();
}
 