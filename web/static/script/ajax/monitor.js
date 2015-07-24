/**
 * OrderParameter tells the order of the visualized clients
 * 1) AP name, SSID , Connected time
 * 2) SSID, Connected time
 * 3) MAC, Connected Time
 * 4) Connected Time
 * 5) Trans. bytes
 * 6) Rec bytes
 * 7) Signal
 * 
 */
var client_orderParameter=1;

/**
 * Generic ajax functions
 */
function monitor_showNetworkStats(networkId){
    loadPage("1-1","network="+networkId);
}
function monitor_showClientStats(networkId,order){
    if(order==undefined){
        order="";
    }
    loadPage("1-3","network="+networkId+"&order="+order);
}
function monitor_updateMonitorOverview(random){
    requestUri = "action=ajaxLoadApStatus&monitor=true";
    executeAjaxRequest("index.php?", requestUri,
        // success
        function(data) {
            if (stopExecution(data)) {
                return;
            }
            if($("#ajaxLoadMonitorOverview"+random).attr("value")!="true"){
                //alert("stopping");
                return;
            }
            if(data.aps!=null){
                updateLeftMenuApStatus(data.aps);
                updateMapApStatus(data.aps);
                updateMonitorStats(data.aps);
            }
            timer=setTimeout("monitor_updateMonitorOverview('"+random+"')",2000);            
            updateMainSize();
        },
        // beforeSend
        function(xhr) {
            cleanTimers();
        },null,false);
}
function hideStats(id){
    
    $("#clients_count_"+id).html(0);
    $("#load_device_text_"+id).html("N\\A");
    $("#load_device_fill_"+id).css("width","0%");
    $("#bandwidth_down_device_"+id).html("-");
    $("#bandwidth_up_device_"+id).html("-");
}
function updateMonitorStats(aps){
    for(var m=0;m<aps.length;m++){   
        if(aps[m].pending){
            //hide stats
            hideStats(aps[m].id);
            continue;
        }
        else{
            if(aps[m].monitoring){
                if(!aps[m].hasData){
                    //hide stats
                    hideStats(aps[m].id);
                    continue;
                }
                else{
                    if(aps[m].online){
                        $("#status_ap_img_"+aps[m].id).attr("src","static/images/status_ap_ok.png");
                        $("#status_ap_img_"+aps[m].id).attr("alt",monitorMessage_green);
                        $("#status_ap_img_"+aps[m].id).attr("title",monitorMessage_green);
                    } 
                    else{
                        //hide stats
                        hideStats(aps[m].id);
                        continue;
                    }
                }
            }
            else{
                //hide stats
                hideStats(aps[m].id);
                continue;
            }
        }      
        if(aps[m].client_stats!=null && aps[m].client_stats!="" && aps[m].client_stats_timestamp!=null && aps[m].client_stats_timestamp!=""){            
            var split=aps[m].client_stats.split("\n");
            $("#clients_count_"+aps[m].id).html(split.length);
        }
        else{
            $("#clients_count_"+aps[m].id).html(0);
        }
        if(aps[m].load!=null && aps[m].load!=""){
            var cload=parseFloat(aps[m].load)*100;
            console.log("Load:"+cload);
            $("#load_device_text_"+aps[m].id).html(cload.toFixed(0)+" %");
            if(cload<40){
                $("#load_device_fill_"+aps[m].id).css("background-color","#5CB85C");
            }
            else{
               if(cload<60){
                    $("#load_device_fill_"+aps[m].id).css("background-color","#F0AD4E");
                } 
                else{
                    $("#load_device_fill_"+aps[m].id).css("background-color","#D9534F");
                }
            }
            if(cload>100){
                cload=100;
            }
            $("#load_device_fill_"+aps[m].id).css("width",cload+"%");
        }
        if(aps[m].byte_received!=null && aps[m].byte_received!="" && aps[m].byte_received_ls!=null && aps[m].byte_received_ls!=""){
            var rec=parseInt(aps[m].byte_received)/1024;
            var rec_ls=parseInt(aps[m].byte_received_ls)/1024;
            
            var sent=parseInt(aps[m].byte_sent)/1024;
            var sent_ls=parseInt(aps[m].byte_sent_ls)/1024;
            
            var server_timestamp=parseInt(aps[m].server_timestamp);
            var server_timestamp_ls=parseInt(aps[m].server_timestamp_ls);
            if((server_timestamp_ls-server_timestamp)/1000==0){
                
            }
            else{
                var recV=0;
                if(rec_ls-rec>0){
                   recV= (rec_ls-rec)/((server_timestamp_ls-server_timestamp)/1000);
                }
                var sentV=0
                if(rec_ls-rec>0){
                  sentV= (sent_ls-sent)/((server_timestamp_ls-server_timestamp)/1000);
                }
                $("#bandwidth_down_device_"+aps[m].id).html(recV.toFixed(0));
                $("#bandwidth_up_device_"+aps[m].id).html(sentV.toFixed(0));
            }
        }
        else{
            $("#bandwidth_down_device_"+aps[m].id).html("-");
            $("#bandwidth_up_device_"+aps[m].id).html("-");
        }
    }
}
function monitor_changeNetwork(page,select){
    switch(page){
        case 'overview':
            showSecondaryMenu("1","0",false);
            loadPage("1-0","network="+select.value);
            break;
    }
}
function monitor_changeNetwork_new(page,value){
    switch(page){
        case 'overview':
            showSecondaryMenu("1","0",false);
            loadPage("1-0","network="+value);
            break;
    }
}
function monitor_createDisplay(id){
    
    var contentString = "<div style='min-width:160px'><p class='googleMsg' style='white-space:nowrap'>" + networks[id][3] + "</p>";
    contentString = contentString
    + "<table style='width:100%'><tr>"
    + "<td align='center'><div id=\"settings_bttn\" class=\"bttn bttn_red\" style=\"width:90px;float:none\"><a href=\"#\" onclick=\"monitor_showApStats('"
    + id
    + "')\"/>Show Stats</a><span></span></div></td></tr></table></div>"
                    
    return contentString;
}
function monitor_createDisplayDb(id){
    var contentString = "<br/>&nbsp;&nbsp;" + networksDb[id][3]+"&nbsp;&nbsp;<br/><br/>";
    //contentString = contentString+"<input type=\"button\" value=\"Monitor\" onclick=\"_monitorNetwork('"+id+"')\"/><input type=\"button\" value=\"Configure\" onclick=\"dashboard_configureNetwork('"+id+"')\"/>";
    return contentString;
}
function monitor_displayDevice(id){
    var sede=networks[id];
    var latlng = new google.maps.LatLng(sede[1], sede[2]);
    infowindow.setContent(monitor_createDisplay(id));
    infowindow.open(map,markers[id]);
    map.panTo(latlng);
}
function monitor_selectDevice(id){
    if(markers[id]==null){
        //show message no location
        $("#noLocationContainer").show('fast');
        if(infowindow!=null){
            infowindow.close();
        }
    }
    else{
        $("#noLocationContainer").hide('fast');
        monitor_displayDevice(id);
    }
    $('#showStatsButton').unbind('click');
    $("#showStatsButton").click(function() {
        monitor_showApStats(id);
    });
}
function monitor_showApStats(apId){
    loadPage("1-2","ap="+apId);
}

/**-----------------------------------
 * Client side monitoring visualization
 *------------------------------------
 */
/**  Pie chart data*/
var pie_packets_received;
var pie_packets_sent;
var pieoption_packets_received;
var pieoption_packets_sent;
var piechart_packets_received;
var piechart_packets_sent;

/** Network stats data */
var devLabels=null;
var devNames=[];
var stacked_ids=[];
var stacked_complexValues=[];

/** Real time statistics for received byte */
var stacked_graph=null;
var stacked_data_for_graph=null;
var stacked_graph_maxval=-1;

/** Real time statistics for sent byte*/
var stacked_graph_sent=null;
var stacked_data_for_graph_sent=null;
var stacked_graph_sent_maxval=-1;

/** Real time statistics for packets */
var stacked_graph_pack=null;
var stacked_data_for_graph_pack=null;
var stacked_graph_pack_maxval=-1;

/** Strings to format legends*/
var bytesuffixes = [' bytes', ' KiB', ' MiB', ' GiB', ' TiB',' PiB',' EiB', ' ZiB', ' YiB'];
var bytesuffixesSi = [' bytes', ' kB', ' MB', ' GB', ' TB',' PB',' EB', ' ZB', ' YB'];
var suffixes = ['', ' k', ' M', ' G', ' T',' P', ' E', ' Z' ,' Y'];

var lastUpdateTime=0;
/** 
 * Accessory methods
 */
function Set() {
    this.content = {};
}
Set.prototype.add = function(val) {
    this.content[val]=true;
}
Set.prototype.remove = function(val) {
    delete this.content[val];
}
Set.prototype.contains = function(val) {
    return (val in this.content);
}
Set.prototype.asArray = function() {
    var res = [];
    for (var val in this.content) {
        res.push(parseInt(val));
    }
    return res;
}
function byteformatValue(v) {
    var old=v;
    var counter=0;
    if (v < 1024) return v+bytesuffixes[counter];
    
    while(v>1024){
        v=v/1024;
        counter++;
    }
    return v.toFixed(2)+bytesuffixes[counter];
}
function getBytePower(v){
    var old=v;
    var counter=0;
    if (v < 1024) return '';
    
    while(v>1024){
        v=v/1024;
        counter++;
    }
    return bytesuffixes[counter];
}
function findIndexDev(deviceId){
    for(var y=0;y<stacked_ids.length;y++){
        if((stacked_ids[y][0]+"")==(deviceId+"")){
            return y;
        }
    }
    return -1;
}
function getAllDataDates(){
    var dataValues=[];
    var s = new Set();
    for (var key in stacked_complexValues) {  
        var serie=stacked_complexValues[key];
        for(var i=0;i<serie.length;i++){
            s.add(parseInt(serie[i].server_timestamp));
        }
    }
    dataValues=s.asArray();
    dataValues.sort(); 
    while(dataValues.length>30){
        dataValues.shift();
    }
    for(var j=dataValues.length-3;j>0;j--){
        if(dataValues[j]-dataValues[j-1]>10*60*1000){
            var newlength=(dataValues.length-1-j);
            while(dataValues.length>newlength){
                dataValues.shift();
            }
            break;
        }
    }
    return dataValues;
}
function getInterpolatedValue(serieKey,time,issent){
    var serie=stacked_complexValues[serieKey];
    // if no values are present return 0
    if(serie.length<=0){
        return 0;
    }
    else{
        //let's find where the requested time is
        for(var y=0;y<serie.length;y++){
            //if the time corresponds to a sample time
            if((parseInt(serie[y].server_timestamp))==time){
                //if it is the first sample just return 0;
                if(y==0){
                    return 0;
                }
                else{
                    var value5=0;
                    if(issent){
                        value5=serie[y].byte_sent-serie[y-1].byte_sent;
                    }else{
                        value5=serie[y].byte_received-serie[y-1].byte_received;
                    }
                    if(value5<=0){
                        value5=0;
                    }
                    else{
                        value5=Math.ceil(value5/ ((serie[y].server_timestamp - serie[y-1].server_timestamp )/1000) )
                    }   
                    return value5;
                }
            }
            else{
                //if current sample time stamp comes before the time
                // time | sample
                if((parseInt(serie[y].server_timestamp))>time){
                    //if it is the last sample we don't have any info from now on so the value should be 0
                    return 0;
                }
                else{
                    //if current sample time stamp comes after the time
                    
                    //(parseInt(serie[y].server_timestamp)+1000)<time
                    if(y==serie.length-1){// sample | time ....
                        if(y-1>=0){
                            if((((time-serie[y].server_timestamp))/1000 )>20  ){
                                return 0;
                            }
                            var value6=0;
                            if(issent){
                                value6=serie[y].byte_sent-serie[y-1].byte_sent;
                            }else{
                                value6=serie[y].byte_received-serie[y-1].byte_received;
                            }
                            if(value6<=0){
                                value6=0;
                            }
                            else{
                                value6=Math.ceil(value6/ ((serie[y].server_timestamp - serie[y-1].server_timestamp )/1000) )
                            }   
                            return value6;
                        }
                        return 0;
                    }
                    else{
                        if( (parseInt(serie[y+1].server_timestamp)) > time ){
                            var value3=0;
                            if(issent){
                                value3=serie[y+1].byte_sent-serie[y].byte_sent;
                            }else{
                                value3=serie[y+1].byte_received-serie[y].byte_received;
                            }
                            if(value3<=0){
                                value3=0;
                            }
                            else{
                                value3=Math.ceil(value3/ ((serie[y+1].server_timestamp - serie[y].server_timestamp )/1000) )
                            }   
                            return value3;
                        }
                    }
                }
            }
        }
    }
    return 0;
}
function getInterpolatedValuePackets(serieKey,time,issent){
    var serie=stacked_complexValues[serieKey];
    // if no values are present return 0
    if(serie.length<=0){
        return 0;
    }
    else{
        //let's find where the requested time is
        for(var y=0;y<serie.length;y++){
            //if the time corresponds to a sample time
            if((parseInt(serie[y].server_timestamp))==time){
                //if it is the first sample just return 0;
                if(y==0){
                    return 0;
                }
                else{
                    var value5=0;
                    if(issent){
                        value5=serie[y].packet_sent-serie[y-1].packet_sent;
                    }else{
                        value5=serie[y].packet_received-serie[y-1].packet_received;
                    }
                    if(value5<=0){
                        value5=0;
                    }
                    else{
                        value5=Math.ceil(value5/ ((serie[y].server_timestamp - serie[y-1].server_timestamp )/1000) )
                    }   
                    return value5;
                }
            }
            else{
                //if current sample time stamp comes before the time
                // time | sample
                if((parseInt(serie[y].server_timestamp))>time){
                    //if it is the last sample we don't have any info from now on so the value should be 0
                    return 0;
                }
                else{
                    //if current sample time stamp comes after the time
                    
                    //(parseInt(serie[y].server_timestamp)+1000)<time
                    if(y==serie.length-1){// sample | time ....
                        if(y-1>=0){
                            if((((time-serie[y].server_timestamp))/1000 )>20  ){
                                return 0;
                            }
                            var value6=0;
                            if(issent){
                                value6=serie[y].packet_sent-serie[y-1].packet_sent;
                            }else{
                                value6=serie[y].packet_received-serie[y-1].packet_received;
                            }
                            if(value6<=0){
                                value6=0;
                            }
                            else{
                                value6=Math.ceil(value6/ ((serie[y].server_timestamp - serie[y-1].server_timestamp )/1000) )
                            }   
                            return value6;
                        }
                        return 0;
                    }
                    else{
                        if( (parseInt(serie[y+1].server_timestamp)) > time ){
                            var value3=0;
                            if(issent){
                                value3=serie[y+1].packet_sent-serie[y].packet_sent;
                            }else{
                                value3=serie[y+1].packet_received-serie[y].packet_received;
                            }
                            if(value3<=0){
                                value3=0;
                            }
                            else{
                                value3=Math.ceil(value3/ ((serie[y+1].server_timestamp - serie[y].server_timestamp )/1000) )
                            }   
                            return value3;
                        }
                    }
                }
            }
        }
    }
    return 0;
}
function dateToYMD(date)
{
    var d = date.getDate();
    var m = date.getMonth()+1;
    var y = date.getFullYear();
    var curr_hour = date.getHours();
    var curr_min = date.getMinutes();
    var curr_sec =date.getSeconds();
    
    return '' + y +''+ (m<=9?'0'+m:m) +''+ (d<=9?'0'+d:d)+" "+(curr_hour<=9?'0'+curr_hour:curr_hour) + ":" + (curr_min<=9?'0'+curr_min:curr_min)+":"+(curr_sec<=9?'0'+curr_sec:curr_sec);
}
/**
 * Ap Stats Graph method
 */
function monitor_updateStatSample(deviceid){
    var ids="";
    var iindex=findIndexDev(deviceid);
    if(iindex==-1){
        ids=-1;
    }
    else{
        ids=stacked_ids[iindex][1];
    } 
    requestUri = "action=ajaxLoadMonitorAPStatisticsFeed&ap="+deviceid+"&lastId="+ids;
    executeAjaxRequest("index.php?", requestUri,
        // success
        function(data) {
            if (stopExecution(data)) {
                return;
            }
            if($("#ajaxLoadMonitorAPStatisticsFeed"+deviceid).attr("value")!="true"){
                //alert("stopping");
                return;
            }
            if(data.feeds!=null){
                var tmp =null;
                var age="";
                var samples=data.feeds;
                if(samples.length>0){
                    var devid=samples[0].device_statsample_fk+"";
                    var indexDev=findIndexDev(devid);
                    if(indexDev!=-1){                    
                        for(var s=0;s<samples.length;s++){   
                            stacked_complexValues[devid].push(samples[s]);
                            if(s==samples.length-1){
                                stacked_ids[indexDev][1]=samples[s].id;
                            }
                        }
                        while(stacked_complexValues[devid].length>30){
                            stacked_complexValues[devid].shift();
                        }
                    }
                    else{
                    //maybe a device added later...
                    }
                }
                if(samples.length>0){
                    console.log("Ap Graph Update"); 
                    regenerateApStatsGraph();
                }
            
                if(data.feeds.length>0){                
                    //get info from last packet
                    var sample=data.feeds[data.feeds.length-1];
                    tmp = parseInt(sample.uptime+"");
                    age=extractTextFromSeconds(tmp);
                    $("#total_uptime").html(age);
                    $("#total_received_bytes").html(formatBytes( (sample.byte_received)));
                    $("#total_sent_bytes").html(formatBytes( (sample.byte_sent)));
                    $("#total_received_packets").html(addPoints(sample.packet_received));
                    $("#total_sent_packets").html(addPoints(sample.packet_sent));
                    if(sample.load!=null){
                        $("#load_average").html((sample.load*100).toFixed(0)+" %");
                    }
                    if(sample.memory_tot!=null && sample.memory_free){
                        if(sample.memory_tot!=0){
                            var percent= ( sample.memory_free*100/sample.memory_tot);
                            $("#ram_average").html(percent.toFixed(0)+" %");
                            
                        }
                    }                
                    pie_packets_received.setCell(0,1,parseInt(sample.packet_received+""));
                    pie_packets_received.setCell(1,1,parseInt(sample.packet_drop_received+""));
                    pie_packets_received.setCell(2,1,parseInt(sample.packet_error_received+""));
                    piechart_packets_received.draw(pie_packets_received,pieoption_packets_received);

                    pie_packets_sent.setCell(0,1,parseInt(sample.packet_sent+""));
                    pie_packets_sent.setCell(1,1,parseInt(sample.packet_drop_sent+""));
                    pie_packets_sent.setCell(2,1,parseInt(sample.packet_error_sent+""));
                    piechart_packets_sent.draw(pie_packets_sent,pieoption_packets_sent);
                
                }
                if(data.feeds.length>0){
                    lastUpdateTime=data.feeds[data.feeds.length-1].server_timestamp/1000
                }
            }
            if(lastUpdateTime!=0){
                tmp = parseInt(data.serverTimestamp-lastUpdateTime);
                age=extractTextFromSeconds(tmp)+ " ago";
                $("#total_update").html(age);
            }
            if(data.cloudconnect!=null){
                age="";
                if(data.cloudconnect.apTime!=-1){
                    tmp = parseInt(data.serverTimestamp- data.cloudconnect.apTime/1000);
                    age=extractTextFromSeconds(tmp)+ " ago";
                }   
                else{
                    age="Information unavailable";
                }
                $("#cloudconnect_apTime").html(age);
                if(data.cloudconnect.apStatus=="online"){
                    $("#apstatus_img").attr("src","static/images/status_online.png");
                    $("#apstatus_img").attr("title",monitorMessage_green);
                    $("#xap_img").hide();
                    $("#cloudconnect_apTime").css("color","green");
                }
                else{
                    if(data.cloudconnect.apStatus=="offline"){
                        $("#apstatus_img").attr("src","static/images/status_offline.png");
                        $("#apstatus_img").attr("title",monitorMessage_red);
                        $("#xap_img").show();
                        $("#cloudconnect_apTime").css("color","red");
                    }
                    else{
                        $("#apstatus_img").attr("src","static/images/status_alert.png");
                        $("#apstatus_img").attr("title",monitorMessage_yellow);
                        $("#xap_img").show();
                        $("#cloudconnect_apTime").css("color","orange");
                    }
                }
                if(data.cloudconnect.agentStatus=="online"){
                    $("#agentstatus_img").attr("src","static/images/tanazaAP_green.png");
                    $("#agentstatus_img").attr("title","Agent connected to cloud");
                    $("#xagent_img").hide();
                }
                else{
                    $("#agentstatus_img").attr("src","static/images/tanazaAP_red.png");
                    $("#agentstatus_img").attr("title","Agent offline");
                    $("#xagent_img").show();
                
                    if(data.cloudconnect.apStatus=="online"){
                        $("#apstatus_img").attr("src","static/images/status_alert.png");
                        $("#apstatus_img").attr("title",monitorMessage_unknown);
                        $("#xap_img").hide();   
                        $("#cloudconnect_apTime").css("color","orange");
                    }
                    $("#xap_img").hide();   
                }
                if(data.cloudconnect.agentLabel){
                    $("#agentLabel").html(data.cloudconnect.agentLabel);
                    $("#agentLabel").attr("href","javascript:{manage_loadConnector('"+data.cloudconnect.agentId+"')}");
                }
            }
            if(data.client_stats_timestamp!=null){
                $("#clientstatsTimestamp").html(data.client_stats_timestamp);
            }
            if(data.client_stats!=null && data.client_stats_timestamp!=null){
                cleanClientArray();
                var row=new Array();        
                var split=data.client_stats.split("\n");
                for(var i=0;i<split.length;i++){
                    var splits=split[i].split("\|");
                    if(splits.length>=6){
                        row=new Array();
                        row.push("ap");//placeholder for ap name
                        for(var k=0;k<splits.length;k++){
                            row.push(splits[k]);
                        }
                        clientArray.push(row);
                    }
                }
                drawClientArray();
            }else{
                cleanClientArray();
                if($('#clientstatstable tbody').is(":visible")){
                    drawClientArray();
                }
                var d=new Date();
                $("#clientstatsTimestamp").html((d.getDate()<10?"0"+d.getDate():d.getDate())+"/"+((d.getMonth() + 1)<10?"0"+(d.getMonth() + 1):(d.getMonth() + 1))+"/"+d.getFullYear()+" "+(d.getHours()<10?"0"+d.getHours():d.getHours())+":"+(d.getMinutes()<10?"0"+d.getMinutes():d.getMinutes()));
            }
            if(data.aps!=null){
                updateLeftMenuApStatus(data.aps);
            }
            timer=setTimeout("monitor_updateStatSample('"+deviceid+"')",2000);            
            updateMainSize();
        },
        // beforeSend
        function(xhr) {
            cleanTimers();
        },null,false);
}
function addPoints(nStr)
{
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}
/**
 * Ap Stats Graph painter
 */
function regenerateApStatsGraph(){
    stacked_data_for_graph=[];
    stacked_data_for_graph_pack=[];    
    devLabels=new Array();
    devLabels.push("X");
    devLabels.push("Received");
    devLabels.push("Sent");
    var dates=getAllDataDates();
    for(var t=0;t<dates.length;t++){
        var interpolatorDate=new Date(dates[t] );
        var array_received=[];
        var array_pack=[];
        array_received.push(interpolatorDate);
        array_pack.push(interpolatorDate);
        for(var key in stacked_complexValues) {  
            var rec=getInterpolatedValue(key,dates[t],false);
            var sen=getInterpolatedValue(key,dates[t],true)
            array_received.push(rec);
            array_received.push(sen);
            var rec_pack=getInterpolatedValuePackets(key,dates[t],false);
            var sen_pack=getInterpolatedValuePackets(key,dates[t],true)
            array_pack.push(rec_pack);
            array_pack.push(sen_pack);
        }
        stacked_data_for_graph.push(array_received);
        stacked_data_for_graph_pack.push(array_pack);
    }  
    stacked_graph_maxval=-1;
    stacked_graph_pack_maxval=-1;
    for(var s=0;s<stacked_data_for_graph.length;s++){
        var stream_rec=stacked_data_for_graph[s];
        var stream_pack=stacked_data_for_graph_pack[s];
        var received=0;
        var received_pack=0;
        for(var s_sub=1;s_sub<stream_rec.length;s_sub++){
            received+=stream_rec[s_sub];
            received_pack+=stream_pack[s_sub];
        }
        if(received>stacked_graph_maxval){
            stacked_graph_maxval=received;
        }
        if(received_pack>stacked_graph_pack_maxval){
            stacked_graph_pack_maxval=received_pack;
        }
    }
    var tresholdPercentage=80;
    var value_Steps=[512,1024,1*1024*1024/40,1*1024*1024/20,1*1024*1024/10,1*1024*1024/4,1*1024*1024/2,1*1024*1024,10*1024*1024,50*1024*1024,100*1024*1024,400*1024*1024,800*1024*1024,1*1024*1024*1024,1*1024*1024*1024*1024];
    var index_value_Steps=0;
    while(index_value_Steps<value_Steps.length && stacked_graph_maxval>value_Steps[index_value_Steps]){
        index_value_Steps++;
    }
    if(index_value_Steps<value_Steps.length && stacked_graph_maxval>(value_Steps[index_value_Steps]*tresholdPercentage/100)){
        index_value_Steps++;
    }
    if(index_value_Steps<value_Steps.length){
        stacked_graph_maxval=value_Steps[index_value_Steps];
    } 
    index_value_Steps=0;
    while(index_value_Steps<value_Steps.length && stacked_graph_pack_maxval>value_Steps[index_value_Steps]){
        index_value_Steps++;
    }
    if(index_value_Steps<value_Steps.length && stacked_graph_pack_maxval>(value_Steps[index_value_Steps]*tresholdPercentage/100)){
        index_value_Steps++;
    }
    if(index_value_Steps<value_Steps.length){
        stacked_graph_pack_maxval=value_Steps[index_value_Steps];
    }
    console.log("Current max:rec="+stacked_graph_maxval+"sent="+stacked_graph_pack_maxval); 
    if(stacked_graph==null && stacked_data_for_graph.length>0){
        stacked_graph=createApStatGraphCompositeBytes("div_g_composite",stacked_data_for_graph,"Time","Received","Sent", "bytes/s",devLabels,'div_g_composite_legend',stacked_graph_maxval);
    }
    var k=0;
    var val;
    if(stacked_data_for_graph.length>0){
        var selection= stacked_graph.getSelection();
        var selection_value=-1;
        if(selection!=-1){
            selection_value=stacked_graph.getValue(selection, 0);
        }
        stacked_graph.updateOptions({
            file: stacked_data_for_graph,
            valueRange: [0, stacked_graph_maxval]
            });
        if(selection==-1 || selection==0){
            stacked_graph.setSelection(1);
            stacked_graph.setSelection(0);
        }
        else{
            for(k=0;k<stacked_data_for_graph.length;k++){
                try{
                    val=stacked_graph.getValue(k, 0);
                    if(val==null){
                        break;
                    }
                    if(val==selection_value){
                        stacked_graph.setSelection(k);
                        break;
                    }
                }catch(Exception ){

                }
            }
        }
    }
    if(stacked_graph_pack==null && stacked_data_for_graph_pack.length>0){
        stacked_graph_pack=createApStatGraphCompositePackets("div_g_packet_composite",stacked_data_for_graph_pack,"Time","Received","Sent", "packets/s",devLabels,'div_g_packet_composite_legend',stacked_graph_pack_maxval);
    }
    if(stacked_data_for_graph_pack.length>0){
        selection= stacked_graph_pack.getSelection();
        selection_value=-1;
        if(selection!=-1){
            selection_value=stacked_graph_pack.getValue(selection, 0);
        }
        stacked_graph_pack.updateOptions({
            file: stacked_data_for_graph_pack,
            valueRange: [0, stacked_graph_pack_maxval]
            });
        if(selection_value!=null){
            if(selection==-1){
                stacked_graph_pack.setSelection(1);
                stacked_graph_pack.setSelection(0);
            }
            for(k=0;k<stacked_data_for_graph_pack.length;k++){
                try{
                    val=stacked_graph_pack.getValue(k, 0);
                    if(val==null){
                        break;
                    }
                    if(val==selection_value){
                        stacked_graph_pack.setSelection(k);
                        break;
                    }
                }catch(Exception ){

                }
            } 
        }
    }
}
/**
 * These methods istantiate and draw the graphs for ap statistics
 */
function createApStatGraphCompositeBytes(elementId,data,xLab,yLab,y2Lab,ytotalLab,labels1,labelDiv,maxval){
    return new Dygraph(document.getElementById(elementId),data, {
        stackedGraph:false,
        labelsDiv:labelDiv,
        labelsDivStyles:{
            'text-align':'left'
        } ,
        labelsSeparateLines:true,
        labelsKMG2: true,
        yValueFormatter: byteformatValue,
        xAxisLabelWidth: 100,
        axes: {
            x: {
                axisLabelFormatter: function(d, gran) {
                    return Dygraph.zeropad(d.getHours()) + ":"
                    + Dygraph.zeropad(d.getMinutes())+ ":"+Dygraph.zeropad(d.getSeconds());
                }
            }
        },
        colors: ["#FE8F00","green","blue","blue","black","darkgreen","gray"],
        fillGraph:true,
        drawPoints: true, 
        showRoller: true, 
        labels: labels1,
        xlabel: xLab,
        ylabel:ytotalLab,
        includeZero:true,
        hideOverlayOnMouseOut:false,
        valueRange: [0, maxval]
        });
}
function createApStatGraphCompositePackets(elementId,data,xLab,yLab,y2Lab,ytotalLab,labels1,labelDiv,maxval){
    return new Dygraph(document.getElementById(elementId),data, {
        stackedGraph:false,
        labelsDiv:labelDiv,
        labelsDivStyles:{
            'text-align':'left'
        } ,
        labelsSeparateLines:true,
        labelsKMG2: true,
        xAxisLabelWidth: 100,
        axes: {
            x: {
                axisLabelFormatter: function(d, gran) {
                    return Dygraph.zeropad(d.getHours()) + ":"
                    + Dygraph.zeropad(d.getMinutes())+ ":"+Dygraph.zeropad(d.getSeconds());
                }
            }
        },
        colors: ["#FE8F00","green","blue","blue","black","darkgreen","gray"],
        fillGraph:true,
        drawPoints: true, 
        showRoller: true, 
        labels: labels1,
        xlabel: xLab,
        ylabel:ytotalLab,
        includeZero:true,
        hideOverlayOnMouseOut:false,
        valueRange: [0, maxval]
        });
}

/**
 * Network Stats method
 */
function monitor_updateNetworkStatSample(networkid){
    var ids="";
    for(var y=0;y<stacked_ids.length;y++){
        ids+=stacked_ids[y][0]+"_"+stacked_ids[y][1]+"|";
    }
    //alert(ids);
    requestUri = "action=ajaxLoadMonitorNetworkStatisticsFeed&network="+networkid+"&ids="+ids;
    $.post(getServer()+"index.php?", requestUri, function(data) {
        if (stopExecution(data)) {
            return;
        }
        if($("#ajaxLoadMonitorNetworkStatisticsFeed"+networkid).attr("value")!="true"){
            return;
        }
        //alert(data.feeds.length);
        for(var f=0;f<data.feeds.length;f++){
            var samples= data.feeds[f];
            if(samples.length>0){
                var devid=samples[0].device_statsample_fk+"";
                var indexDev=findIndexDev(devid);
                if(indexDev!=-1){
                    for(var s=0;s<samples.length;s++){   
                        stacked_complexValues[devid].push(samples[s]);
                        if(s==samples.length-1){
                            stacked_ids[indexDev][1]=samples[s].id;
                        }
                    }
                    while(stacked_complexValues[devid].length>30){
                        stacked_complexValues[devid].shift();
                    }
                }
                else{
                //maybe a device added later...
                }
            }
        //}
        }
        if(devLabels==null){
            devLabels=[];
            //alert(data.devNames);
            devLabels.push("X");
            for (var x=0;x<data.devNames.length;x++) {  
                devLabels.push(data.devNames[x][1]);
            }
        }
        var refresh=false;
        if(data.feeds.length>0){
            for(var k=0;k<data.feeds.length;k++){
                if(data.feeds[k].length>0){
                    refresh=true;
                    break;
                }
            }
        }
        if(refresh){
            console.log("Graph Update"); 
            regenerateNetworkStatsGraph();
        }
        timer=setTimeout("monitor_updateNetworkStatSample('"+networkid+"')",2000);            
        updateMainSize();
    },'jsonp');

}
/**
 * Network Stats painter
 */
function regenerateNetworkStatsGraph(){
    stacked_data_for_graph=[];
    stacked_data_for_graph_sent=[];    
    var dates=getAllDataDates();
    for(var t=0;t<dates.length;t++){
        var interpolatorDate=new Date(dates[t] );
        var array_received=[];
        var array_sent=[];
        array_received.push(interpolatorDate);
        array_sent.push(interpolatorDate);
        for(var key in stacked_complexValues) {  
            var rec=getInterpolatedValue(key,dates[t],false);
            var sen=getInterpolatedValue(key,dates[t],true)
            array_received.push(rec);
            array_sent.push(sen);
        }
        stacked_data_for_graph.push(array_received);
        stacked_data_for_graph_sent.push(array_sent);
    }  
    stacked_graph_maxval=-1;
    stacked_graph_sent_maxval=-1;
    for(var s=0;s<stacked_data_for_graph.length;s++){
        var stream_rec=stacked_data_for_graph[s];
        var stream_sen=stacked_data_for_graph_sent[s];
        var received=0;
        var sent=0;
        for(var s_sub=1;s_sub<stream_rec.length;s_sub++){
            received+=stream_rec[s_sub];
            sent+=stream_sen[s_sub];
        }
        if(received>stacked_graph_maxval){
            stacked_graph_maxval=received;
        }
        if(sent>stacked_graph_sent_maxval){
            stacked_graph_sent_maxval=sent;
        }
    }
    var tresholdPercentage=80;
    var value_Steps=[512,1024,1*1024*1024/40,1*1024*1024/20,1*1024*1024/10,1*1024*1024/4,1*1024*1024/2,1*1024*1024,10*1024*1024,50*1024*1024,100*1024*1024,400*1024*1024,800*1024*1024,1*1024*1024*1024,1*1024*1024*1024*1024];
    var index_value_Steps=0;
    while(index_value_Steps<value_Steps.length && stacked_graph_maxval>value_Steps[index_value_Steps]){
        index_value_Steps++;
    }
    if(index_value_Steps<value_Steps.length && stacked_graph_maxval>(value_Steps[index_value_Steps]*tresholdPercentage/100)){
        index_value_Steps++;
    }
    if(index_value_Steps<value_Steps.length){
        stacked_graph_maxval=value_Steps[index_value_Steps];
    } 
    index_value_Steps=0;
    while(index_value_Steps<value_Steps.length && stacked_graph_sent_maxval>value_Steps[index_value_Steps]){
        index_value_Steps++;
    }
    if(index_value_Steps<value_Steps.length && stacked_graph_sent_maxval>(value_Steps[index_value_Steps]*tresholdPercentage/100)){
        index_value_Steps++;
    }
    if(index_value_Steps<value_Steps.length){
        stacked_graph_sent_maxval=value_Steps[index_value_Steps];
    }
    console.log("Current max:rec="+stacked_graph_maxval+"sent="+stacked_graph_sent_maxval); 
    if(stacked_graph==null && stacked_data_for_graph.length>0){
        stacked_graph=createNetworkStatGraphCompositeBytes("div_g_composite",stacked_data_for_graph,"Time","Received","Sent", "bytes/s",devLabels,'div_g_composite_legend',stacked_graph_maxval);
    }
    var k=0;
    var val;
    if(stacked_data_for_graph.length>0){
        var selection= stacked_graph.getSelection();
        var selection_value=-1;
        if(selection!=-1){
            selection_value=stacked_graph.getValue(selection, 0);
        }
        stacked_graph.updateOptions({
            file: stacked_data_for_graph,
            valueRange: [0, stacked_graph_maxval]
            });
        if(selection==-1 || selection==0){
            stacked_graph.setSelection(1);
            stacked_graph.setSelection(0);
        }
        else{
            for(k=0;k<stacked_data_for_graph.length;k++){
                try{
                    val=stacked_graph.getValue(k, 0);
                    if(val==null){
                        break;
                    }
                    if(val==selection_value){
                        stacked_graph.setSelection(k);
                        break;
                    }
                }catch(Exception ){

                }
            }
        }
    }
    if(stacked_graph_sent==null && stacked_data_for_graph_sent.length>0){
        stacked_graph_sent=createNetworkStatGraphCompositeBytes("div_g_composite_sent",stacked_data_for_graph_sent,"Time","Received","Sent", "bytes/s",devLabels,'div_g_composite_sent_legend',stacked_graph_sent_maxval);
    }
    if(stacked_data_for_graph_sent.length>0){
        selection= stacked_graph_sent.getSelection();
        selection_value=-1;
        if(selection!=-1){
            selection_value=stacked_graph_sent.getValue(selection, 0);
        }
        stacked_graph_sent.updateOptions({
            file: stacked_data_for_graph_sent,
            valueRange: [0, stacked_graph_sent_maxval]
            });
        if(selection_value!=null){
            if(selection==-1){
                stacked_graph_sent.setSelection(1);
                stacked_graph_sent.setSelection(0);
            }
            for(k=0;k<stacked_data_for_graph_sent.length;k++){
                try{
                    val=stacked_graph_sent.getValue(k, 0);
                    if(val==null){
                        break;
                    }
                    if(val==selection_value){
                        stacked_graph_sent.setSelection(k);
                        break;
                    }
                }catch(Exception ){

                }
            } 
        }
    }
}
/**
 * This method istantiates and draws the graph for network statistics
 */
function createNetworkStatGraphCompositeBytes(elementId,data,xLab,yLab,y2Lab,ytotalLab,labels1,labelDiv,maxval){
    /*return new Dygraph(document.getElementById(elementId),data,{labelsDiv:'div_g_composite_legend',labelsDivStyles:{'text-align':'left'} ,labelsSeparateLines:true,labelsKMG2: true,yValueFormatter: byteformatValue,xAxisLabelWidth: 100,axes: {
                x: {
                  axisLabelFormatter: function(d, gran) {
                    return Dygraph.zeropad(d.getHours()) + ":"
                        + Dygraph.zeropad(d.getMinutes())+ ":"+Dygraph.zeropad(d.getSeconds());
                  }
                }
              },colors: ["#FE8F00","red"],drawPoints: true, showRoller: true, labels: [xLab, yLab,y2Lab],xlabel: xLab,ylabel:ytotalLab} );*/
    return new Dygraph(document.getElementById(elementId),data, {
        stackedGraph:true,
        labelsDiv:labelDiv,
        labelsDivStyles:{
            'text-align':'left'
        } ,
        labelsSeparateLines:true,
        labelsKMG2: true,
        yValueFormatter: byteformatValue,
        xAxisLabelWidth: 100,
        axes: {
            x: {
                axisLabelFormatter: function(d, gran) {
                    return Dygraph.zeropad(d.getHours()) + ":"
                    + Dygraph.zeropad(d.getMinutes())+ ":"+Dygraph.zeropad(d.getSeconds());
                }
            }
        },
        colors: ["#FE8F00","red","green","blue","black","darkgreen","gray",],
        drawPoints: true, 
        showRoller: true, 
        labels: labels1,
        xlabel: xLab,
        ylabel:ytotalLab,
        includeZero:true,
        hideOverlayOnMouseOut:false,
        valueRange: [0, maxval]
        });
}
var clientTable=null;
var clientTable_option=null;

var template_client_single_ap= [
'<tr class="{{ class_name }}">',
'<td>',
'<div class="big">',
'{{ ssid }}',
'</div>',
'<div class="big">',
'{{ mac }}',
'</div>',
'<div class="small">',
'{{ connected_time }}',
'</div>',
'<div class="small">',
'{{ in_time }}',
'</div>',
'<div class="big">',
'{{ txbytes }}',
'</div>',
'<div class="big">',
'{{ rxbytes }}',
'</div>',
'<div class="small">',
'<div style="width:95%;border:1px solid black;height:13px;text-align:center;position:relative">',
'<div class="signal" style="z-index:1;position:absolute;left:0px;top:0px;width:100%;height:13px">{{ signalval }}</div>',
'<div style="float:left;height:13px;width:{{ percentage }}%;background-color:{{ color }};z-index:0;"></div>',
'<div class="cleared"></div>',
'</div>',
'</div>',
'<div class="cleared"></div>',
'</td>',
'</tr>'
].join('');
var template_client_network_ap= [
'<tr class="{{ class_name }}">',
'<td>',
'<div class="big">',
'{{ ap }}',
'</div>',
'<div class="big">',
'{{ ssid }}',
'</div>',
'<div class="big">',
'{{ mac }}',
'</div>',
'<div class="small">',
'{{ connected_time }}',
'</div>',
'<div class="small">',
'{{ txbytes }}',
'</div>',
'<div class="small">',
'{{ rxbytes }}',
'</div>',
'<div class="small">',
'<div style="width:95%;border:1px solid black;height:13px;text-align:center;position:relative">',
'<div class="signal" style="z-index:1;position:absolute;left:0px;top:0px;width:100%;height:13px">{{ signalval }}</div>',
'<div style="float:left;height:13px;width:{{ percentage }}%;background-color:{{ color }};z-index:0;"></div>',
'<div class="cleared"></div>',
'</div>',
'</div>',
'<div class="cleared"></div>',
'</td>',
'</tr>'
].join('');
                                                
var clientArray=new Array();
function cleanClientArray(){
    clientArray=new Array();
}
//"mac|in_time|txb|rxb|txpk|rxpk|signal|txbitrate|rxbitrate|connected_time|tx_retries|tx_failed|ssid\n 
function drawClientArray(){
    if(clientArray!=null){
        if($('#clientstatstable tbody')!=null && $('#clientstatstable tbody').length==1){
            $('#clientstatstable tbody').html("");
            for(var i=0;i<clientArray.length;i++){
                var client=clientArray[i];
                var op_str= template_client_single_ap;
                op_str=op_str.replace('{{ class_name }}', (i%2==0)?"odd":"even");            
                op_str=op_str.replace('{{ ssid }}', htmlEntities(client[13]));
                op_str=op_str.replace('{{ mac }}', client[1]);
                op_str=op_str.replace('{{ connected_time }}', extractTextFromSecondsTruncated(client[10]));
                var tt=parseInt(client[2]);
                if(tt<1000){
                    tt=tt+" ms";
                }
                else{
                    tt=extractTextFromSecondsTruncated(parseInt(client[2])/1000);
                }
                op_str=op_str.replace('{{ in_time }}',tt );
                op_str=op_str.replace('{{ txbytes }}', formatBytes(client[3],true));
                op_str=op_str.replace('{{ rxbytes }}', formatBytes(client[4],true));
                var sig=Math.abs(parseInt(client[7]+""));
                var color="red";
                if(sig<=50){
                    sig=100;
                    color="green";
                }
                else{
                    if(sig>50 && sig<=65){
                        if(sig==65){
                            sig=60;
                        }
                        else{
                            sig=(40*(65-sig)/15);
                            sig=sig+60;
                        }
                        sig=sig.toFixed(0);
                        color="green";
                    }
                    else{
                        if(sig>65 && sig<=75){
                            if(sig==75){
                                sig=30;
                            }
                            else{
                                sig=(30*(75-sig)/10);
                                sig=sig+30;
                            }
                            sig=sig.toFixed(0);
                            color="orange";
                        }
                        else{
                            if(sig>95){
                                sig=95;
                            }
                            else{
                                sig=(30*(95-sig)/20);
                                sig=sig+0;
                            }
                            sig=sig.toFixed(0);
                            color="red";
                        }
                    }
                }
                op_str=op_str.replace('{{ percentage }}', sig);

                if(sig>60){
                    color="green";
                }else{
                    if(sig>30){
                        color="orange";
                    }
                }
                op_str=op_str.replace('{{ signalval }}', client[7]);
                op_str=op_str.replace('{{ color }}', color);
                $(op_str).appendTo('#clientstatstable tbody');
            }
            if(clientArray.length==0){
                $("<td colspan='7' style='text-align:center' class='odd'>No client connected</td>").appendTo('#clientstatstable tbody');
            }
        }
    }
    
}
//"ap|mac|in_time|txb|rxb|txpk|rxpk|signal|txbitrate|rxbitrate|connected_time|tx_retries|tx_failed|ssid\n 
function drawNetworkClientArray(){
    if(clientArray!=null){
        if($('#clientstatstable tbody')!=null && $('#clientstatstable tbody').length==1){
            $('#clientstatstable tbody').html("");
            for(var i=0;i<clientArray.length;i++){
                var client=clientArray[i];
                var op_str= template_client_network_ap;
                op_str=op_str.replace('{{ class_name }}', (i%2==0)?"odd":"even");            
                op_str=op_str.replace('{{ ap }}', client[0]);
                op_str=op_str.replace('{{ ssid }}', htmlEntities(client[13]));
                op_str=op_str.replace('{{ mac }}', client[1]);
                op_str=op_str.replace('{{ connected_time }}', extractTextFromSecondsTruncated(client[10]));
                var tt=parseInt(client[2]);
                if(tt<1000){
                    tt=tt+" ms";
                }
                else{
                    tt=extractTextFromSecondsTruncated(parseInt(client[2])/1000);
                }
                op_str=op_str.replace('{{ in_time }}',tt );
                op_str=op_str.replace('{{ txbytes }}', formatBytes(client[3],true));
                op_str=op_str.replace('{{ rxbytes }}', formatBytes(client[4],true));
                var sig=Math.abs(parseInt(client[7]+""));
                var color="red";
                if(sig<=50){
                    sig=100;
                    color="green";
                }
                else{
                    if(sig>50 && sig<=65){
                        if(sig==65){
                            sig=60;
                        }
                        else{
                            sig=(40*(65-sig)/15);
                            sig=sig+60;
                        }
                        sig=sig.toFixed(0);
                        color="green";
                    }
                    else{
                        if(sig>65 && sig<=75){
                            if(sig==75){
                                sig=30;
                            }
                            else{
                                sig=(30*(75-sig)/10);
                                sig=sig+30;
                            }
                            sig=sig.toFixed(0);
                            color="orange";
                        }
                        else{
                            if(sig>95){
                                sig=1;
                            }
                            else{
                                sig=(30*(95-sig)/20);
                                sig=sig+0;
                            }
                            sig=sig.toFixed(0);
                            color="red";
                        }
                    }
                }
                op_str=op_str.replace('{{ percentage }}', sig);

                if(sig>60){
                    color="green";
                }else{
                    if(sig>30){
                        color="orange";
                    }
                }
                op_str=op_str.replace('{{ signalval }}', client[7]);
                op_str=op_str.replace('{{ color }}', color);
                $(op_str).appendTo('#clientstatstable tbody');
            }
            if(clientArray.length==0){
                $("<td colspan='7' style='text-align:center' class='odd'>No client connected</td>").appendTo('#clientstatstable tbody');
            }
        }
    }
    
}
 
function monitor_updateClientStatSample(networkid){
    requestUri = "action=ajaxLoadMonitorClientStatisticsFeed&network="+networkid;
    $.post(getServer()+"index.php?", requestUri, function(data) {
        if (stopExecution(data)) {
            return;
        }
        if($("#ajaxLoadMonitorClientStatisticsFeed"+networkid).attr("value")!="true"){
            return;
        }
        if(data.clients!=null){
            cleanClientArray();
            var row=new Array();      
            for(var l=0;l<data.clients.length;l++){
                var client_stats_str=data.clients[l]["client_stats"];
                var split=client_stats_str.split("\n");
                for(var i=0;i<split.length;i++){
                    var splits=split[i].split("\|");
                    if(splits.length>=6){
                        row=new Array();
                        row.push(data.clients[l]["apname"]);//placeholder for ap name
                        for(var k=0;k<splits.length;k++){
                            row.push(splits[k]);
                        }
                        clientArray.push(row);
                    }
                }
            }
            /**
            * OrderParameter tells the order of the visualized clients
            * 1) AP name, SSID , Connected time
            * 2) SSID, Connected time
            * 3) MAC, Connected Time
            * 4) Connected Time
            * 5) Trans. bytes
            * 6) Rec bytes
            * 7) Signal
            * 
            */

            //"ap|mac|in_time|txb|rxb|txpk|rxpk|signal|txbitrate|rxbitrate|connected_time|tx_retries|tx_failed|ssid\n
            switch(client_orderParameter){
                case 1:
                    clientArray.sort(function(a, b) { 
                        return a[0] > b[0]?1:-1;
                    });
                    break;
                case 2:
                    clientArray.sort(function(a, b) { 
                        return a[13] > b[13]?1:-1;
                    });
                    break;
                case 3:
                    clientArray.sort(function(a, b) { 
                        return a[1] > b[1]?1:-1;
                    });
                    break;
                 case 4:
                    clientArray.sort(function(a, b) { 
                        return parseInt(a[10]) > parseInt(b[10])?1:-1;
                    });
                    break;
                 case 5:
                    clientArray.sort(function(a, b) { 
                        return parseInt(a[3]) > parseInt(b[3])?1:-1;
                    });
                    break;
                 case 6:
                    clientArray.sort(function(a, b) { 
                        return parseInt(a[4]) > parseInt(b[4])?1:-1;
                    });
                    break;
                 case 7:
                    clientArray.sort(function(a, b) { 
                        return parseInt(a[7]) > parseInt(b[7])?1:-1;
                    });
                    break;
            }            
            drawNetworkClientArray();
        }
        timer=setTimeout("monitor_updateClientStatSample('"+networkid+"')",2000);            
        updateMainSize();
    },'jsonp');

}