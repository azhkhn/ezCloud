var manageEditNetwork=0;
function loadEditNetwork(id,returnto){
    loadPage("ajaxLoadEditNetwork","context=manage"+(returnto!=null?"&returnTo="+returnto:"")+"&start=true&id="+id,"exposeFullPage");
}

function manage_selectNetwork(id){
    
}
function submitAddNetwork(context,returnTo){
    var value=jQuery("#addNetworkName").attr("value");
    var lat=jQuery("#addNetworkLat").attr("value");
    var lon=jQuery("#addNetworkLon").attr("value");
    loadPage("ajaxLoadAddNetwork", "name="+escape(value)+"&lat="+escape(lat)+"&lon="+escape(lon)+"&context="+context+(returnTo!=null?"&returnTo="+returnTo:""),"exposeFullPage");
}
function submitEditNetwork(context,id,returnTo){
    var value=jQuery("#addNetworkName").attr("value");
    loadPage("ajaxLoadEditNetwork", "name="+escape(value)+"&context="+context+(returnTo!=null?"&returnTo="+returnTo:"")+"&id="+id,"exposeFullPage");
}
function manage_loadConnector(connectorId){
    try{
        if(getApplet("tapplet")!=undefined && getApplet("tapplet").stop != undefined){
            getApplet("tapplet").stop();
        //getApplet("tapplet").destroy();
        }
    }catch(err){
        
    }
    loadPage("manage-agents-settings","id="+connectorId);
}
function editAgentNameExpressCallback(data){
    if(data.errorCode=="0"){
        $("#changeNameIcon").attr("src","static/images/accept_small.png");
        $("#changeNameInfo").html("");
        $("#changeNameIcon").show();
        $("#changeNameInfo").show();
    }
    else{
        $("#changeNameIcon").attr("src","static/images/alert_small.png");
        $("#changeNameInfo").html(data.errorMessage);
        $("#changeNameIcon").show();
        $("#changeNameInfo").show();
    }
    $("#c_name").attr("value",data.name);
    $("#tdAgentList"+data.id).html(data.name);
    $("#c_name").removeAttr("disabled");
}

function manageAgents_updateAgentInfoExpress(){
    requestUri = "action=ajaxLoadEditAgentInfoExpress";
    executeAjaxRequest("index.php?", requestUri,
        // success
        function(data) {
            if (stopExecution(data)) {
                return;
            }
            if($("#ajaxLoadManageNetworksManage").attr("value")=="true"){
                if(data.status=="ok"){
                    updateAgentInfo(data);
                    timer=setTimeout("manageAgents_updateAgentInfoExpress()",2000);
                }
                else{
                    timer=setTimeout("manageAgents_updateAgentInfoExpress()",2000);
                }
                updateMainSize();
            }
        },
        // beforeSend
        function(xhr) {
            cleanTimers();
        },null,false);
}
function manageAgents_updateAgentInfoExpress_details(agentid){
    requestUri = "action=ajaxLoadEditAgentInfoExpress&id="+agentid;
    executeAjaxRequest("index.php?", requestUri,
        // success
        function(data) {
            if (stopExecution(data)) {
                return;
            }
            if($("#ajaxLoadManageNetworksManage_configureConnector").attr("value")=="true"){
                if(data.status=="ok"){
                    updateAgentInfo(data);
                    if(data.cloudconnect!=null){
                        age="";
                        if(data.cloudconnect.apTime!=-1){
                            tmp = parseInt(data.serverTimestamp- data.cloudconnect.apTime/1000);
                            if(tmp<0){
                                tmp=0;
                            }
                            else{
                                if (tmp > 60) {
                                    age = Math.floor(tmp%60).toFixed(0) + " sec "+ age;
                                    if (tmp > 3600) {
                                        age = Math.floor((tmp%3600)/ 60 ).toFixed(0) + " min "+ age;
                                        if (tmp > 24 * 3600) {
                                            age = Math.floor((tmp%(24 * 3600))/3600).toFixed(0) + " hour "+ age;
                                            if (tmp > 31*24 * 3600) {
                                                age = Math.floor((tmp%(31*24 * 3600))/(24 * 3600)).toFixed(0) + " day "+ age;
                                                age = Math.floor(tmp / (31*24 * 3600)).toFixed(0) + " month" + (Math.floor(tmp / (31*24 * 3600)).toFixed(0) != "1" ? "s" : "") + " "+age;
                                            } else {
                                                age = Math.floor(tmp / (24 * 3600)).toFixed(0) + " day" + (Math.floor(tmp / (24 * 3600)).toFixed(0) != "1" ? "s" : "") + " "+age;
                                            }
                                        } else {
                                            age = Math.floor(tmp / 3600).toFixed(0) + " hour" + (Math.floor(tmp / 3600).toFixed(0) != "1" ? "s" : "") + " "+age;
                                        }
                                    } else {
                                        age = Math.floor(tmp / 60).toFixed(0) + " min" + (Math.floor(tmp / 60).toFixed(0) != "1" ? "s" : "") + " "+ age;
                                    }
                                } else {
                                    age = Math.floor(tmp/1).toFixed(0) + " sec ";
                                }
                            }
                            age=age+" ago";
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
                            $("#cloudconnect_agentStatus").html("Online");      
                            $("#cloudconnect_agentStatus").css("color","green");
                            $("#agentstatus_img").attr("src","static/images/tanazaAP_green.png");
                            $("#agentstatus_img").attr("title","Agent connected to cloud");
                            $("#xagent_img").hide();
                        }
                        else{
                            $("#cloudconnect_agentStatus").html("Offline");      
                            $("#cloudconnect_agentStatus").css("color","red");
                            $("#agentstatus_img").attr("src","static/images/tanazaAP_red.png");
                            $("#agentstatus_img").attr("title","Agent offline");
                            $("#xagent_img").show();
                            $("#xap_img").hide();   
                        }
                    }
                    timer=setTimeout("manageAgents_updateAgentInfoExpress_details('"+agentid+"')",2000);
                }
                else{
                    timer=setTimeout("manageAgents_updateAgentInfoExpress_details('"+agentid+"')",2000);
                }
                updateMainSize();
            }
        },
        // beforeSend
        function(xhr) {
            cleanTimers();
        },null,false);
}
function updateAgentInfo(data){
    for(var i=0;i<data.connectors.length;i++){
        if(data.connectors[i].online==true){
            $("#agentInfoConnection"+data.connectors[i]['id']).attr("src","static/images/agent_online.png");
        }
        else{
            $("#agentInfoConnection"+data.connectors[i]['id']).attr("src","static/images/agent_offline.png");
        }
        if(data.connectors[i].online==true){
            $("#agentInfoConnectionTc"+data.connectors[i]['id']).attr("src","static/images/accept_small.png");
        }
        else{
            $("#agentInfoConnectionTc"+data.connectors[i]['id']).attr("src","static/images/alert_small.png");
        }
        if(data.connectors[i].online==true){
            $("#agentInfoAge"+data.connectors[i]['id']).html("Online");
            $("#agentInfoAge"+data.connectors[i]['id']).css("color","green");
        }
        else{
            if(data.connectors[i].age.toLowerCase()!="never"){
                $("#agentInfoAge"+data.connectors[i]['id']).html(data.connectors[i].age);
                $("#agentInfoAge"+data.connectors[i]['id']).css("color","black");
            }
            else{
                $("#agentInfoAge"+data.connectors[i]['id']).html(data.connectors[i].age);
                $("#agentInfoAge"+data.connectors[i]['id']).css("color","orange");
            }
        }
        $("#agentInfoRegistration"+data.connectors[i]['id']).html(data.connectors[i].apcount);
    }
}

function startProxyCheck(){
    if(getApplet("tapplet")!=undefined && getApplet("tapplet").stop != undefined){
        getApplet("tapplet").stop();
    //getApplet("tapplet").destroy();
    }
    $('#agentBridgeAppletContainer').show();
    
}
function proxyCheck(){
//alert('ok');
}
function proxyCheckConnected(){
//alert('okConnected')
}
function proxyNoCheck(){
    alert('ko')
}

function agent_daemonClientIdReceived( cid ) {
    updateProgressBar(50);
    displayMessage("Connected to client " + cid);
}
function agent_daemonChallengeReceived( cid, cha ) {
    updateProgressBar(40);
    if(cid.length>32){
        cid=cid.substring(0,32);
    }
    else{
        if(cid.length<5){
            cid="";
        }
    }
    console.log("daemonChallengeReceived cid: $"+cid+"$ cha: "+cha+ "$");
    currentDaemonId = cid;
    currentDaemonChallenge = cha;
    agent_requestChallengeResponse();			
}

function agent_requestChallengeResponse() {
    updateProgressBar(50);
    console.log("Server response to challenge requested: " + currentDaemonChallenge);
    var statusCode={ 
        500: function() {
            daemonLoginUnsuccessful();
        },
        404: function() {
            daemonLoginUnsuccessful();
        }
    };
    var data2="action=daemon_login&client_id="+currentDaemonId+"&challenge="+currentDaemonChallenge+"&auth_token=" + auth_token;
    $.ajax({
        type: "GET",
        cache: false,
        async: true,
        url: serverAddress+"index.php",
        data: data2,
        crossDomain: true,
        dataType: "jsonp",
        //context: document.body,
        success: function(data) {
            if ( data.status==0 ) {
                jsonError(data);
            }
            else { 
                console.log("Challenge response received:"+data.response);
                currentDaemonResponse = data.response;
                agent_performDaemonLogin();
            }
        },
        statusCode: statusCode
    });
}
function agent_performDaemonLogin() {
    console.log("Accessing agent...");
    var rs = getApplet("tapplet").performLogin( currentDaemonResponse );
    if ( rs ) {
        displayMessage("Authenticating...");
    } else {
        displayMessage("Connection lost while authenticating",true);
    }
}
function agent_daemonLogged(){
    updateProgressBar();
    alert('ooook');
    displayMessage("Logged in to agent");
}
function deleteNetwork(id){
    loadPage("3-0","command=delete&id="+id);
}
function updateCoverageApStatus(aps){
    for(var m=0;m<aps.length;m++){    
        if(aps[m].pending){
            $("#AP_"+aps[m].id).removeClass("ap_offline");
            $("#AP_"+aps[m].id).removeClass("ap_ok");
            $("#AP_"+aps[m].id).removeClass("ap_problem");
            $("#AP_"+aps[m].id).removeClass("ap_nomonitor");
            $("#AP_"+aps[m].id).addClass("ap_pending");
            $("#AP_"+aps[m].id+" img").attr("src","static/images/loader-coverage.gif");
            $("#AP_"+aps[m].id+" img").attr("alt","Loading Configuration");
            $("#AP_"+aps[m].id+" img").attr("title","Loading Configuration");
            
        }
        else{
            if(aps[m].monitoring){
                if(!aps[m].hasData){
                    $("#AP_"+aps[m].id).removeClass("ap_pending");
                    $("#AP_"+aps[m].id).removeClass("ap_ok");
                    $("#AP_"+aps[m].id).removeClass("ap_problem");
                    $("#AP_"+aps[m].id).removeClass("ap_nomonitor");
                    $("#AP_"+aps[m].id).addClass("ap_offline");
                    $("#AP_"+aps[m].id+" img").attr("src","static/images/ap_offline.png");
                    $("#AP_"+aps[m].id+" img").attr("alt",monitorMessage_yellow);
                    $("#AP_"+aps[m].id+" img").attr("title",monitorMessage_yellow);
                }
                else{
                    if(aps[m].online){
                        $("#AP_"+aps[m].id).removeClass("ap_pending");
                        $("#AP_"+aps[m].id).removeClass("ap_offline");
                        $("#AP_"+aps[m].id).removeClass("ap_problem");
                        $("#AP_"+aps[m].id).removeClass("ap_nomonitor");
                        $("#AP_"+aps[m].id).addClass("ap_ok");
                        $("#AP_"+aps[m].id+" img").attr("src","static/images/ap_ok.png");
                        $("#AP_"+aps[m].id+" img").attr("alt",monitorMessage_green);
                        $("#AP_"+aps[m].id+" img").attr("title",monitorMessage_green);
                    } 
                    else{
                        $("#AP_"+aps[m].id).removeClass("ap_pending");
                        $("#AP_"+aps[m].id).removeClass("ap_offline");
                        $("#AP_"+aps[m].id).removeClass("ap_ok");
                        $("#AP_"+aps[m].id).removeClass("ap_nomonitor");
                        $("#AP_"+aps[m].id).addClass("ap_problem");
                        $("#AP_"+aps[m].id+" img").attr("src","static/images/ap_problem.png");
                        $("#AP_"+aps[m].id+" img").attr("alt",monitorMessage_red);
                        $("#AP_"+aps[m].id+" img").attr("title",monitorMessage_red);
                    }
                }
            }
            else{
                $("#AP_"+aps[m].id).removeClass("ap_pending");
                $("#AP_"+aps[m].id).removeClass("ap_offline");
                $("#AP_"+aps[m].id).removeClass("ap_ok");
                $("#AP_"+aps[m].id).removeClass("ap_problem");
                $("#AP_"+aps[m].id).addClass("ap_nomonitor");
                $("#AP_"+aps[m].id+" img").attr("src","static/images/ap_nomonitor.png");
                $("#AP_"+aps[m].id+" img").attr("alt","No monitoring info available");
                $("#AP_"+aps[m].id+" img").attr("title","No monitoring info available");
            }
        }
    }
}
function manage_deleteAgent(id,count){
    if(count>0){
        $("#alertDeleteAgent").show();
    }
    else{
        loadPage("ajaxLoadDeleteAgent","id="+id,"withMenu");
    }
}