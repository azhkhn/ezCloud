/****************************************
 * Tanaza Javascript Framework and utils
 ****************************************/

/****************************************
 * GLOBAL VARIABLES
 ***************************************/
var tztimer=null;
var bytes_kb=1024;
var bytes_mb=1024*1024;
var bytes_gb=1024*1024*1024;
var bytes_tb=1024*1024*1024*1024;
//Ensure console.log exists to avoid script crash when in production
window.console = window.console || {
    log:function(){}
};

/****************************************
 * GLOBAL VARIABLES - END
 ***************************************/

/*********************************
 * AJAX Requests functionalities
 *********************************/
// history_ajax stores all ajax events
var history_ajax=new Array();
var lastInterruptible=null;
//used to server dates in different timezones based on the user browser timezone
var tsDiff= -((new Date().getTimezoneOffset())/60);
function executeAjaxRequest(url,data,success,beforeSend,statusCode,interruptible){
   return ;
/*
    if ( typeof(auth_token) != "undefined" ) {
        url = url + "&auth_token=" + auth_token;
    }
    if(interruptible==null){
        interruptible=true;
    }
    if(statusCode==null){
        statusCode={ 
            404: function() {
                alert('page not found');
            },
            200: 
            function(data){			  
            }
        };
    }
    if(interruptible){
        var timestampId=new Date().getTime();
        history_ajax[""+timestampId]=new Array(""+timestampId);
        data=data+"&timestampId="+timestampId;
        lastInterruptible=""+timestampId;
    }
    $.ajax({
        type: "GET",
        cache: false,
        async: true,
        //url: getServer()+url,
        data: "tz="+tsDiff+"&"+data,
        crossDomain: true,
        dataType: "jsonp",
        //context: document.body,
        success: success,
        statusCode: statusCode,
        beforeSend: beforeSend,
        xhrFields: {
            withCredentials: true
        }
    });
*/    
}
function checkFocedStatus(data){
    if(data!=null && ((data.forceAdminBlocked!=null && data.forceAdminBlocked=='true') || (data.forceTrialExpired!=null && data.forceTrialExpired=='true') ) ){
        var requestUri = "action=userAccount_subscription";
        var params="";
        if (params != null) {
            requestUri += "&" + params;
        }
        updateLayout(3);
        executeAjaxRequest("index.php?", requestUri,
            // success
            function(data) {
                if(data.menu3!=null){
                    showSection("menuLevel3",data.menu3 );
                }
                if(data.content){
                    showSection("content", data.content);
                }
                if(data.titleText){
                    jQuery("#titleText").html(data.titleText);
                }
                showSection("menuLevel3", data.menu3);
                showSection("content", data.content);
                jQuery("#titleText").html(data.titleText);
                if (data.postJavascript != null) {
                    eval(data.postJavascript);
                }
                updateMainSize();
            },
            // beforeSend
            function(xhr) {
                // xhr.overrideMimeType( 'text/plain; charset=x-user-defined' );
                showLoader("menuLevel3");
                showLoader("content");
            },null, false);
        return true;
    }
    return false;
}
function checkFocedLogout(data){
    if(data!=null && data.forceLogout!=null && data.forceLogout=='true'){
        alert('Your current session expired. Please login again.');
        window.location.href=getServer()+'/?action=logout';
        return true;
    }
    return false;
}
//checks it the execution of the body of the received ajax request need to be executed or not
function stopExecution(data){
    if(checkFocedLogout(data)){
       return true; 
    }
    if(checkFocedStatus(data)){
       return true; 
    }
    if(data!=null && data.timestampId!=null){
        if(history_ajax[""+data.timestampId]!=null){
            if(lastInterruptible!=""+data.timestampId){
                history_ajax[""+data.timestampId]=null;
                //alert('stopExecution');
                return true;
            }
            else{
                lastInterruptible=null;
                return false;
            }
        }
    }
    return false;
}
function stopExecutionNoHistory(data){
    if(checkFocedLogout(data)){
       return true; 
    }
    if(checkFocedStatus(data)){
       return true; 
    }
    return false;
}
function performLogout() {
    alert('Your current session expired. Please login again.');
    window.location = "/dashboard/?c=logout";
}
/********************************* 
 * AJAX Requests functionalities - END
 *********************************/
/**
 * Generic variables used to handle timeouts in generic purpose way
 */
var timer;
var interval;

var dashboard_starttime;
var dashboard_random;

function cleanTimers(){
    if(interval!=null){
        clearInterval(interval);
    }
    if(timer!=null){
        clearTimeout(timer);
    }
    if(tztimer!=null){
        clearTimeout(tztimer);
    }
}

/**
 * This function allows to get an applet object 
 */
function getApplet(movieName) {
    if (navigator.appName.indexOf("Microsoft") != -1) {
        return window[movieName];
    } else {
        if(typeof document[movieName] != "undefined"){
            return document[movieName];
        }
        return null;
    }
}

function formatBytes(tmp,truncated){
    var kb="";
    tmp=parseInt(tmp+"");
    if (tmp > bytes_kb) {//>= kbytes
        if (tmp > bytes_mb) {//>= Mbytes
            if (tmp > bytes_gb) {//>= Gbytes
                if (tmp > bytes_tb) {//>= Gbytes
                    kb = (tmp / bytes_tb).toFixed(2) + ((truncated!=null && truncated)?" TB":" TByte") + ((tmp / bytes_tb).toFixed(2) != "1" ? ((truncated!=null && truncated)?"":"s") : "") + "";
                } else {
                    kb = (tmp / bytes_gb).toFixed(2) + ((truncated!=null && truncated)?" GB":" GByte") + ((tmp / bytes_gb).toFixed(2) != "1" ? ((truncated!=null && truncated)?"":"s") : "") + "";
                }
                
            } else {
                kb = (tmp / bytes_mb).toFixed(2) + ((truncated!=null && truncated)?" MB":" MByte") + ((tmp / bytes_mb).toFixed(2) != "1" ? ((truncated!=null && truncated)?"":"s") : "") + "";
            }
        } else {
            kb = (tmp / bytes_kb).toFixed(2) + ((truncated!=null && truncated)?" KB":" KByte") + ((tmp / bytes_kb).toFixed(2) != "1" ? ((truncated!=null && truncated)?"":"s") : "") + "";
        }
    } else {//bytes
        kb = (tmp/1).toFixed(2) + " bytes ";
    }
    return kb;
}


function extractTextFromSecondsTruncated(seconds){
    seconds=parseInt(seconds+"");
    if(seconds<0){
        seconds=0;
    }
    else{
        age="";
        if (seconds > 60) {
            if (seconds > 3600) {
                if (seconds > 24 * 3600) {
                    if (seconds > 31*24 * 3600) {
                        age = Math.floor(seconds / (31*24 * 3600)).toFixed(0) + " month" + (Math.floor(seconds / (31*24 * 3600)).toFixed(0) != "1" ? "s" : "") + " "+age;
                    } else {
                        age = Math.floor(seconds / (24 * 3600)).toFixed(0) + " day" + (Math.floor(seconds / (24 * 3600)).toFixed(0) != "1" ? "s" : "") + " "+age;
                    }
                } else {
                    age = Math.floor(seconds / 3600).toFixed(0) + " hour" + (Math.floor(seconds / 3600).toFixed(0) != "1" ? "s" : "") + " "+age;
                }
            } else {
                age = Math.floor(seconds / 60).toFixed(0) + " min" + (Math.floor(seconds / 60).toFixed(0) != "1" ? "s" : "") + " "+ age;
            }
        } else {
            age = Math.floor(seconds/1).toFixed(0) + " sec ";
        }
    }
    return age;
}
function extractTextFromSeconds(seconds){
    seconds=parseInt(seconds+"");
    var age="";
    if(seconds<0){
        seconds=0;
    }
    else{
        if (seconds > 60) {
            age = Math.floor(seconds%60).toFixed(0) + " sec "+ age;
            if (seconds > 3600) {
                age = Math.floor((seconds%3600)/ 60 ).toFixed(0) + " min "+ age;
                if (seconds > 24 * 3600) {
                    age = Math.floor((seconds%(24 * 3600))/3600).toFixed(0) + " hour "+ age;
                    if (seconds > 31*24 * 3600) {
                        age = Math.floor((seconds%(31*24 * 3600))/(24 * 3600)).toFixed(0) + " day "+ age;
                        age = Math.floor(seconds / (31*24 * 3600)).toFixed(0) + " month" + (Math.floor(seconds / (31*24 * 3600)).toFixed(0) != "1" ? "s" : "") + " "+age;
                    } else {
                        age = Math.floor(seconds / (24 * 3600)).toFixed(0) + " day" + (Math.floor(seconds / (24 * 3600)).toFixed(0) != "1" ? "s" : "") + " "+age;
                    }
                } else {
                    age = Math.floor(seconds / 3600).toFixed(0) + " hour" + (Math.floor(seconds / 3600).toFixed(0) != "1" ? "s" : "") + " "+age;
                }
            } else {
                age = Math.floor(seconds / 60).toFixed(0) + " min" + (Math.floor(seconds / 60).toFixed(0) != "1" ? "s" : "") + " "+ age;
            }
        } else {
            age = Math.floor(seconds/1).toFixed(0) + " sec ";
        }
    }
    return age;
}
function filterMac(element){
    //console.log("onchange");
    var value=element.value;
    value=value.toUpperCase();
    /** A little cleanup if pasted size is too big**/
    if(value.length>50){
        value=value.substr(0,50);
    }
    var newvalue="";
    var index=0;
    for(var i=0;i<value.length;i++){
        //console.log("Iteration:"+i+" index:"+index+" value:"+value+" newvalue:"+newvalue);
        if(index%3==2){
            if(value.charAt(i)==':' || value.charAt(i)=='-'){
                newvalue=newvalue+":";
                index++;
                continue;
            }
            else{
                newvalue=newvalue+":";
                index++;
                i--;
                continue;
            }
        }
        else{
            //console.log("check di:"+value.charCodeAt(i));
            if((value.charCodeAt(i)>=65 && value.charCodeAt(i)<=70) || (value.charCodeAt(i)>=48 && value.charCodeAt(i)<=57)){
                //console.log("Trovato valore valido"+value.charAt(i));
                newvalue=newvalue+value.charAt(i);
                index++;
            }
        }
    }
    if(newvalue.length>16){
        newvalue=newvalue.substr(0,17);
        change=true;
    }
    if(newvalue!=value){
        //console.log("Change to:"+newvalue);
        element.value=newvalue;
    }
    if(newvalue.length==17){
        $("#bttnAdd").addClass("okbttnAdd");
    }
    else{
         $("#bttnAdd").removeClass("okbttnAdd");
    }
}
function enableMacSintax(elementid,nextfocusid){
    $("#"+elementid).keydown(function(event) {
        var valore=$("#"+elementid).attr("value");
        var keyCode=parseInt(event.keyCode);
        //console.log(keyCode);
        //console.log(event.metaKey);
        var found=false;
        if(event.keyCode==13){
            var newvalue="";
            var index=0;
            if(valore.length==17){
                for(var i=0;i<valore.length;i++){
                    //console.log("Iteration:"+i+" index:"+index+" value:"+value+" newvalue:"+newvalue);
                    if(index%3==2){
                        if(valore.charAt(i)==':' || valore.charAt(i)=='-'){
                            newvalue=newvalue+":";
                            index++;
                            continue;
                        }
                        else{
                            newvalue=newvalue+":";
                            index++;
                            i--;
                            continue;
                        }
                    }
                    else{
                        //console.log("check di:"+value.charCodeAt(i));
                        if((valore.charCodeAt(i)>=65 && valore.charCodeAt(i)<=70) || (valore.charCodeAt(i)>=48 && valore.charCodeAt(i)<=57)){
                            //console.log("Trovato valore valido"+value.charAt(i));
                            newvalue=newvalue+valore.charAt(i);
                            index++;
                        }
                    }
                }
                if(newvalue==valore){
                    ap_add_process();
                }
            }
            
        }
        //delete and  back button
        if(event.keyCode==46 || event.keyCode==8){
            if(valore.length>0){
                valore=valore.substring(0,valore.length-1);
            }
            event.preventDefault();
            $("#"+elementid).attr("value",valore);
            if($("#"+elementid).attr("value").length==17){
                $("#bttnAdd").addClass("okbttnAdd");
            }
            else{
                $("#bttnAdd").removeClass("okbttnAdd");
            }
            return;
        }
        if(event.keyCode==9){
            //$("#"+nextfocusid).focus();
            found=true;
        }
        else{
            if(event.ctrlKey){
                if(keyCode==65 || keyCode==67 || keyCode==86){
                    if(keyCode==86){
                        if(valore.length<=16){

                        }
                    }
                }
                else{
                    event.preventDefault();
                }
            }else{
                if(valore.length%3==2 && valore.length<=16){
                    valore=valore+":";
                    found=true;
                }
                if((keyCode>=48 && keyCode<=57)){
                    //numbers
                    if(valore.length<=16){
                        valore+=String.fromCharCode(keyCode).toUpperCase();
                        if(valore.length<17 && valore.length%3==2){
                            valore+=":";
                        }
                    }
                    found=true;
                }
                else{
                    if((keyCode>=65 && keyCode<=70)){
                        //lettere
                        if(valore.length<=16){
                            valore+=String.fromCharCode(keyCode).toUpperCase();
                            if(valore.length<17 && valore.length%3==2){
                                valore+=":";
                            }
                        }
                        found=true;
                    }
                    else{
                        if((keyCode>70 && keyCode<=90)){
                            //ignore because after f
                            found=true;
                        }
                        else{
                            if((keyCode>=96 && keyCode<=105)){
                                // alert("97");
                                //tastierino numerico
                                if(valore.length<=16){
                                    var res=keyCode-96;
                                    valore+=res+"";
                                    if(valore.length<17 && valore.length%3==2){
                                        valore+=":";
                                    }
                                }
                                found=true;
                            }
                            else{
                                event.preventDefault();
                            }
                        }
                    }
                }
            }
        }
        if(found){
            event.preventDefault();
            $("#"+elementid).attr("value",valore);
        }
        if($("#"+elementid).attr("value").length==17){
            $("#bttnAdd").addClass("okbttnAdd");
        }
        else{
            $("#bttnAdd").removeClass("okbttnAdd");
        }
    });
}
function enableMacSintaxCallbackEval(elementid,enableMacSintaxCallbackEval){
    $("#"+elementid).keydown(function(event) {
        var valore=$("#"+elementid).attr("value");
        var keyCode=parseInt(event.keyCode);
        //console.log(keyCode);
        //console.log(event.metaKey);
        var found=false;
        if(event.keyCode==13){
            var newvalue="";
            var index=0;
            if(valore.length==17){
                for(var i=0;i<valore.length;i++){
                    //console.log("Iteration:"+i+" index:"+index+" value:"+value+" newvalue:"+newvalue);
                    if(index%3==2){
                        if(valore.charAt(i)==':' || valore.charAt(i)=='-'){
                            newvalue=newvalue+":";
                            index++;
                            continue;
                        }
                        else{
                            newvalue=newvalue+":";
                            index++;
                            i--;
                            continue;
                        }
                    }
                    else{
                        //console.log("check di:"+value.charCodeAt(i));
                        if((valore.charCodeAt(i)>=65 && valore.charCodeAt(i)<=70) || (valore.charCodeAt(i)>=48 && valore.charCodeAt(i)<=57)){
                            //console.log("Trovato valore valido"+value.charAt(i));
                            newvalue=newvalue+valore.charAt(i);
                            index++;
                        }
                    }
                }
                if(newvalue==valore){
                    //ap_add_process();//noaction
                }
            }
            eval(enableMacSintaxCallbackEval);
        }
        //delete and  back button
        if(event.keyCode==46 || event.keyCode==8){
            if(valore.length>0){
                valore=valore.substring(0,valore.length-1);
            }
            event.preventDefault();
            $("#"+elementid).attr("value",valore);
            if($("#"+elementid).attr("value").length==17){
                $("#bttnAdd").addClass("okbttnAdd");
            }
            else{
                $("#bttnAdd").removeClass("okbttnAdd");
            }
            return;
        }
        if(event.keyCode==9){
            //$("#"+nextfocusid).focus();
            found=true;
        }
        else{
            if(event.ctrlKey){
                if(keyCode==65 || keyCode==67 || keyCode==86){
                    if(keyCode==86){
                        if(valore.length<=16){

                        }
                    }
                }
                else{
                    event.preventDefault();
                }
            }else{
                if(valore.length%3==2 && valore.length<=16){
                    valore=valore+":";
                    found=true;
                }
                if((keyCode>=48 && keyCode<=57)){
                    //numbers
                    if(valore.length<=16){
                        valore+=String.fromCharCode(keyCode).toUpperCase();
                        if(valore.length<17 && valore.length%3==2){
                            valore+=":";
                        }
                    }
                    found=true;
                }
                else{
                    if((keyCode>=65 && keyCode<=70)){
                        //lettere
                        if(valore.length<=16){
                            valore+=String.fromCharCode(keyCode).toUpperCase();
                            if(valore.length<17 && valore.length%3==2){
                                valore+=":";
                            }
                        }
                        found=true;
                    }
                    else{
                        if((keyCode>70 && keyCode<=90)){
                            //ignore because after f
                            found=true;
                        }
                        else{
                            if((keyCode>=96 && keyCode<=105)){
                                // alert("97");
                                //tastierino numerico
                                if(valore.length<=16){
                                    var res=keyCode-96;
                                    valore+=res+"";
                                    if(valore.length<17 && valore.length%3==2){
                                        valore+=":";
                                    }
                                }
                                found=true;
                            }
                            else{
                                event.preventDefault();
                            }
                        }
                    }
                }
            }
        }
        if(found){
            event.preventDefault();
            $("#"+elementid).attr("value",valore);
        }
        if($("#"+elementid).attr("value").length==17){
            $("#bttnAdd").addClass("okbttnAdd");
        }
        else{
            $("#bttnAdd").removeClass("okbttnAdd");
        }
    });
}
/*************************
 * STRING utilities
 **************************/

function trim(str){
    return str.replace(/^\s+|\s+$/g,"");
}
function isBlankOrNull(text){
    var pattern = new RegExp(/^\s*$/i);
    return pattern.test(text);
}
var macAddressRegExp = new RegExp("^(([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2})$");
var ipAddressRegExp = new RegExp("^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$");
  
function isValidUrl(url){
    return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);
}
function isValidColor(color){
    return isRGBHexColor(color) || isRGBAColor(color);
}
function isRGBHexColor(color){
    var pattern = new RegExp("^\#[a-fA-F0-9]{6}$");
    return pattern.test(color);
}
function isRGBAColor(color){
    //rgba(255, 0, 0, 0.2)
    var rgbRegex = /^rgba\(\s*((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\s*,\s*((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\s*,\s*((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)),(0|1|[0]?\.[0-9]+|1.[0]*)\)$/;
    return color.match(rgbRegex)!=null;
}
function getRgbish(c){
    var i= 0, itm,
    M= c.replace(/ +/g, '').match(/(rgba?)|(d+(.d+)?%?)|(.d+)/g);
    if(M && M.length> 3){
        while(i<3){
            itm= M[++i];
            if(itm.indexOf('%')!= -1){
                itm= Math.round(parseFloat(itm)*2.55);
            }
            else itm= parseInt(itm);
            if(itm<0 || itm> 255) return NaN;
            M[i]= itm;
        }
        if(c.indexOf('rgba')=== 0){
            if(M[4]==undefined ||M[4]<0 || M[4]> 1) return NaN;
        }
        else if(M[4]) return NaN;
        return M[0]+'('+M.slice(1).join(',')+')';
    }
    return NaN;
}
function isValidEmail(emailAddress){
    var pattern = new RegExp(/^(("[\w-+\s]+")|([\w-+]+(?:\.[\w-+]+)*)|("[\w-+\s]+")([\w-+]+(?:\.[\w-+]+)*))(@((?:[\w-+]+\.)*\w[\w-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][\d]\.|1[\d]{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\]?$)/i);
    return pattern.test(emailAddress);
}
function isValidIp(ipAddress){
    var pattern = new RegExp(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/i);
    return pattern.test(ipAddress);
}
function isValidAMPMTime(time){
    var pattern = new RegExp(/^(0[0-9]|[0-9]|1[0-2]):(0[0-9]|[1-5][0-9])\s(AM|PM)$/i);
    return pattern.test(time);
}
function isValid24HTime(time){
    var pattern = new RegExp(/^(0[0-9]|[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$/i);
    return pattern.test(time);
}
function isValidDns(ipAddress){
    return isValidIp(ipAddress);
}
function isValidDomainName(ipAddress){
    return isValidHostName(ipAddress);
}
function isValidHostName(hostname){
    if(trim(hostname).startsWith("http:") || trim(hostname).startsWith("https:") ){
        return false;
    }
    var pattern = new RegExp(/^(\*\.)?(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/i);
    return pattern.test(hostname);
}
function isValidNetmask(ipAddress){
    var pattern = new RegExp(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-2]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/i);
    return pattern.test(ipAddress);
}
function isValidMac(macAddress){
    var pattern = new RegExp(/^(([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2})$/i);
    return pattern.test(macAddress);
}
function isValidNetworkName(text){
    if(text==null){
        return false;
    }
    if(text.length>=validationMinNetworkLength && text.length<=validationMaxNetworkLength){
        return true;
    }
    return false;
}
function isValidAgentName(text){
    if(text==null){
        return false;
    }
    if(text.length>=validationMinAgentLength && text.length<=validationMaxAgentLength){
        return true;
    }
    return false;
}
function isValidSsidName(text){
    if(text==null){
        return false;
    }
    if(text.length>=validationMinSsidLength && text.length<=validationMaxSsidLength){
        return true;
    }
    return false;
}
function isValidDeviceName(text){
    if(text==null){
        return false;
    }
    if(text.length>=validationMinDeviceLength && text.length<=validationMaxDeviceLength){
        return true;
    }
    return false;
}
function isValidUsernameName(text){
    if(text==null){
        return false;
    }
    if(text.length>=validationMinUsernameLength && text.length<=validationMaxUsernameLength){
        return true;
    }
    return false;
}
function isValidPasswordName(text){
    if(text==null){
        return false;
    }
    if(text.length>=validationMinPasswordLength && text.length<=validationMaxPasswordLength){
        return true;
    }
    return false;
}
function isValidSnmpReadName(text){
    if(text==null){
        return false;
    }
    if(text.length>=validationMinSnmpReadLength && text.length<=validationMaxSnmpReadLength){
        return true;
    }
    return false;
}
function isValidSnmpWriteName(text){
    if(text==null){
        return false;
    }
    if(text.length>=validationMinSnmpWriteLength && text.length<=validationMaxSnmpWriteLength){
        return true;
    }
    return false;
}
function isValidSnmpSysnameName(text){
    if(text==null){
        return false;
    }
    if(text.length>=validationMinSnmpSysnameLength && text.length<=validationMaxSnmpSysnameLength){
        return true;
    }
    return false;
}
function isValidSnmpSyscontactName(text){
    if(text==null){
        return false;
    }
    if(text.length>=validationMinSnmpSyscontactLength && text.length<=validationMaxSnmpSyscontactLength){
        return true;
    }
    return false;
}
function isValidSnmpSyslocationName(text){
    if(text==null){
        return false;
    }
    if(text.length>=validationMinSnmpSyslocationLength && text.length<=validationMaxSnmpSyslocationLength){
        return true;
    }
    return false;
}
function isValidSnmpSourceName(text){
    if(text==null){
        return false;
    }
    if(!isValidIp(text)){
        return false;
    }
    if(text.length>=validationMinSnmpSourceLength && text.length<=validationMaxSnmpSourceLength){
        return true;
    }
    return false;
}
function isValidSnmpWriteSourceName(text){
    if(text==null){
        return false;
    }
    if(!isValidIp(text)){
        return false;
    }
    if(text.length>=validationMinWriteSnmpSourceLength && text.length<=validationMaxWriteSnmpSourceLength){
        return true;
    }
    return false;
}
function isValidSnmpTrapCommunityName(text){
    if(text==null){
        return false;
    }
    if(text.length>=validationMinSnmpTrapCommunityLength && text.length<=validationMaxSnmpTrapCommunityLength){
        return true;
    }
    return false;
}
function isValidSnmpTrapSourceName(text){
    if(text==null){
        return false;
    }
    if(!isValidIp(text)){
        return false;
    }
    if(text.length>=validationMinSnmpTrapSourceLength && text.length<=validationMaxSnmpTrapSourceLength){
        return true;
    }
    return false;
}
function isValidSnmpTrapPortName(text){
    if(text==null){
        return false;
    }
    if(text.length>=validationMinSnmpTrapPortLength && text.length<=validationMaxSnmpTrapPortLength){
        return true;
    }
    return false;
}
function isValidSnmpManagerSourceName(text){
    if(text==null){
        return false;
    }
    if(!isValidIp(text)){
        return false;
    }
    if(text.length>=validationMinSnmpManagerSourceLength && text.length<=validationMaxSnmpManagerSourceLength){
        return true;
    }
    return false;
}
function isValidPositiveNumber(num){
    var pattern = new RegExp(/^[1-9]+[0-9]*$/);
    return pattern.test(num);
}
function isValidOnlyTextAndNumber(num){
    var pattern = new RegExp(/^[a-zA-Z0-9\s]*$/);
    return pattern.test(num);
}
function isValidPositiveNumberOrZero(num){
    if(num=='0'){
        return true;
    }
    var pattern = new RegExp(/^[1-9]+[0-9]*$/);
    return pattern.test(num);
}
function isFloatValue(text){
    var reFloat = new RegExp("^[-+]?[0-9]*\.?[0-9]+$");
    return text.match(reFloat);
}
function is_string(input){
    return typeof(input)=='string';
}
/*************************
 * STRING utilities - END
 **************************/

/*************************
 * GRAPHICS utilities
 *************************/
function oldOuterHeight(element){
    //return 100;
    return element.height();
}
function oldOuterWidth(element){
    //return 100;
    return element.width();
}
function createProgressBar(max,prog,id){
    var maxValue=100;
    var progressValue=0;
    if(id!=null){
        idProgress=id;
    }
    if(max!=null){
        maxValue=max;
    }
    if(prog!=null){
        progressValue=prog;
    }

    jsProgress=$("#downloadProgress");
    
    var progressBarTemplate= [
    '<div class="progress progress-striped active">',
    '<div class="progress-bar" role="progressbar" aria-valuenow="'+progressValue+'" aria-valuetransitiongoal="'+progressValue+'" aria-valuemin="0" aria-valuemax="'+maxValue+'" style="width: '+progressValue+'%;">',
    '</div>',
    '</div>',
    ].join('');
    
    var parent=jsProgress.parent();
    parent.html(progressBarTemplate);
    parent.progressbar();
    parent.addClass("bootstrap-scope");
    $('.progress-bar').addClass("progress-bar-warning");
    /*jsProgress.progressbar({
        max: maxValue, 
        value: progressValue
    });*/

}
function getProgressBarMaxValue(){
    var jsProgress=$('.progress-bar');
    return parseInt(jsProgress.attr('aria-valuemax'));
}
/**
 * Updates the progress bar with the specified current value
 * @param progress
 */
function updateProgressBar(progress){
    //console.log("updateProgressBar:"+progress);
    var jsProgress=$('.progress-bar');
    if(progress==null){
        jsProgress.attr('aria-valuetransitiongoal', parseInt(jsProgress.attr('aria-valuemax'))).progressbar();
    }
    else{
        if(parseInt(progress)>parseInt(jsProgress.attr('aria-valuemax'))){
            jsProgress.attr('aria-valuetransitiongoal', parseInt(jsProgress.attr('aria-valuemax'))).progressbar();
        }
        jsProgress.attr('aria-valuetransitiongoal',  parseInt(progress+"")).progressbar();
    }
}
/**
 * Progress bar based on pseudo-logarithmic progression
 */
function startProgressBarLogProgression(part,max){
    var partition=1;
    if(part!=null){
        partition=part;
    }
    var maxTot=1200;
    if(max!=null){
        maxTot=max;
    }
    createProgressBar(maxTot,1);
    if(interval!=null){
        clearInterval(interval);
    }
    interval=setInterval('updateProgressBarLog('+partition+')',500);
}
function prepareProgressBarLogProgression(part,max){

    var maxTot=1200;
    if(max!=null){
        maxTot=max;
    }
    createProgressBar(maxTot,1);
    if(interval!=null){
        clearInterval(interval);
    }
}
function updateProgressBarLog(partition){
    //console.log("updateProgressBarLog:"+partition);
    var jsProgress=$('.progress-bar');
    if(partition==1){        
        var diff=parseInt(jsProgress.attr('aria-valuemax'))-parseInt(jsProgress.attr('aria-valuetransitiongoal'));
        diff=diff/25;
        if(diff<1){
            diff=1;
        }	
        var newvalue=parseInt(diff+"")+parseInt(jsProgress.attr('aria-valuetransitiongoal'));
        //console.log("1)new value: "+newvalue);
        updateProgressBar(newvalue);
    }
    else{
        var diff2=parseInt(jsProgress.attr('aria-valuemax'))/partition-parseInt(jsProgress.attr('aria-valuetransitiongoal'))%(parseInt(jsProgress.attr('aria-valuemax'))/partition);
        diff2=diff2/25/partition;
        if(diff2<1){
            diff2=1;
        }	
        var newvalue=parseInt(diff2+"")+parseInt(jsProgress.attr('aria-valuetransitiongoal'));
        //console.log("2)new value: "+newvalue);
        updateProgressBar(newvalue);
    }
}
function stopProgressBarLogProgression(){
    if(interval!=null){
        clearInterval(interval);
    }
}
function createSelectWrapper(selector, preferredWidth,iconPath){
    if($(selector).is("select")){        
        var selectTemplate= [
            '<div class="btn-group btn-group-xs" id="{{ selectid }}" {{ preferredWidth }}>',
                '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown"  style="width:100%">',
                    '<table style="width:100%"><tr><td class="valuetd">',
                    '{{ current }}</td>',
                    '<td style="width:15px;"><span class="caret" style="vertical-align: middle"></span>',
                    '</td></tr></table>',
                '</button>',
                '<ul class="dropdown-menu" role="menu" style="min-width:200px;width:auto;max-height:250px;overflow:auto">',
                    '{{ options }}',
                '</ul>',
            '</div>',
            ].join('');
        var a='<li><a href="#">Action</a></li>';
        var selectOptionData = [];
        $(selector).find('option')
            .each(function(){
                selectOptionData.push({
                    value: $(this).attr('value'),
                    text: $(this).html(),
                    selected: $(this).attr('selected'),
                    classes: $(this).attr('class')
                    });

            });	
        var newhtml=selectTemplate;        
        newhtml=newhtml.replace('{{ selectid }}', $(selector).attr("id")+"_dropdown");
        
        if(preferredWidth!=null){
            newhtml=newhtml.replace('{{ preferredWidth }}', 'style="width:'+preferredWidth+'px"');
            newhtml=newhtml.replace('{{ preferredWidth }}', 'style="width:'+preferredWidth+'px"');
        }
        var options="";
        var currentvalue;
        for(var t=0;t<selectOptionData.length;t++){
            if(selectOptionData[t]["selected"]=="selected"){
                currentvalue=selectOptionData[t]["text"];
            }
            options+='<li '+(selectOptionData[t]["selected"]=="selected"?'data-selected="true"':'data-selected="false"')+' data-value="'+selectOptionData[t]["value"]+'" data-label="'+selectOptionData[t]["text"]+'"><a href="javascript:{void(0)}">'+selectOptionData[t]["text"]+'</a></li>';
        }
        if(currentvalue==null){
            currentvalue=selectOptionData[0]["text"];
        }
        newhtml=newhtml.replace('{{ current }}', currentvalue);
        newhtml=newhtml.replace('{{ options }}', options);
        $(selector).after(newhtml);
        $(selector).parent().addClass("bootstrap-scope");
        $(selector).hide();
        $("#"+$(selector).attr("id")+"_dropdown").find('li')
            .click(function(){
                $(this).closest(".btn-group").find(".valuetd").html($(this).attr("data-label"));
                $(this).closest(".btn-group").find("li").attr("data-selected","false");
                $(this).attr("data-selected","true");
                $(selector).val($(this).attr("data-value")).trigger('change');
            });	
    }
}
function selectWrapperSetValue(selector,value){
    //console.log("selectWrapperSetValue "+selector+" to "+value);
    if( !(jQuery.type(selector)=== "string")){
        selector="#"+$(selector).attr("id");
    }
    var elem=$(selector+"_dropdown").find("li:eq("+value+")");
    $(elem).closest(".btn-group").find(".valuetd").html($(elem).attr("data-label"));
    $(elem).closest(".btn-group").find("li").attr("data-selected","false");
    $(elem).attr("data-selected","true");
    $(selector).val($(elem).attr("data-value"));
}
function selectWrapperGetValue(selector){
    if( !(jQuery.type(selector)=== "string")){
        selector="#"+$(selector).attr("id");
    }
    var elements=$(selector+"_dropdown").find("li");
    for(var t=0;t<elements.length;t++){
        if($(elements[t]).attr("data-selected")=="true"){
            return $(selector+"_dropdown li").index($(elements[t]));
        }
    }
    return $(selector+"_dropdown li").index($(elements[0]));
}
function activateToolTip(selector,yoffset,xoffset){
    if(yoffset==null){
        yoffset=-10;
    }
    if(xoffset==null){
        xoffset=20;
    }
    $(selector).tooltiptz({
        position: "center right", 
        opacity: 0.7,
        offset:[yoffset,xoffset],
        tipClass: "tooltipExpose"
    });
}
function activateSsidToolTip(element){
    element.tooltiptz({
        position: "top center",
        offset:[-50,-20],
        effect: 'slide',
        relative:true,
        delay:100,
        predelay:500
    });
    
}
function resetToolTips(){
    $(".tooltipExpose").remove();
}

function setupVerticalTabs(elementId,selectedIndex){
   if(elementId=="tabsexpose"){
        $("#"+elementId).addClass("tzui-widget-content").addClass("tzui-corner-all").addClass("tzui-tabs-vertical").addClass("tzui-helper-clearfix");
        $("#"+elementId+" ul").addClass("tzui-tabs-nav").addClass("tzui-helper-reset").addClass("tzui-helper-clearfix").addClass("tzui-widget-header").addClass("tzui-corner-all");
        //$("#"+elementId+" li").addClass("tzui-state-default").addClass("tzui-corner-left");
        if(selectedIndex!=null && selectedIndex!=-1){
            $("#"+elementId+" li:eq("+selectedIndex+")").addClass("tzui-state-active").addClass("tzui-tabs-selected");
        }
   }
   else{
        $("#"+elementId).addClass("tzui-tabs").addClass("tzui-widget").addClass("tzui-widget-content").addClass("tzui-corner-all").addClass("tzui-tabs-vertical").addClass("tzui-helper-clearfix");
        $("#"+elementId+" ul").addClass("tzui-tabs-nav").addClass("tzui-helper-reset").addClass("tzui-helper-clearfix").addClass("tzui-widget-header").addClass("tzui-corner-all");
        $("#"+elementId+" li").addClass("tzui-state-default").addClass("tzui-corner-left");
        $("#"+elementId+" li" ).hover( function(){$(this).addClass("tzui-state-hover")}, function(){$(this).removeClass("tzui-state-hover")} );

        $("#"+elementId+" li").click(function(){
            $(this).parent().children().filter("li").removeClass("tzui-state-active").removeClass("tzui-tabs-selected");
            $(this).addClass("tzui-state-active").addClass("tzui-tabs-selected");
        });
        if(selectedIndex!=null && selectedIndex!=-1){
            $("#"+elementId+" li:eq("+selectedIndex+")").addClass("tzui-state-active").addClass("tzui-tabs-selected");
        }
   }
    
}
/*************************
 * GRAPHICS utilities - END
 *************************/

/*************************
 * META DATA utilities
 *************************/
/**
 * This array contains title and url for all section, to allow more user friendly display
 */
var a_titles = new Array();
a_titles["dashboard"]=["Dashboard","Dashboard"];
a_titles["monitor-overview"]=["Monitor Overview","Monitor-Overview"];
a_titles["monitor-network-statistics"]=["Monitor - Network Statistics","Monitor-Network Statistics"];
a_titles["monitor-ap-statistics"]=["Monitor - Access Point Statistics","Monitor-Access Point Statistics"];
a_titles["monitor-client-statistics"]=["Monitor - Client Statistics","Monitor-Client Statistics"];
a_titles["configure-overview"]=["Configure - Overview","Configure-Overview"];
a_titles["configure-settings"]=["Configure - Configuration","Configure-Configuration"];
a_titles["configure-ap-list"]=["Configure - Access Point list","Configure-Access Point List"];
a_titles["configure-ssid-list"]=["Configure - Ssid List","Configure-Ssid-List"];
a_titles["configure-ssid"]=["Configure - Ssid","Configure-Ssid"];
a_titles["configure-add-access-point"]=["Configure - Add Access Point","Configure-Add Access Point"];
a_titles["configure-add-access-point-tanaza"]=["Configure - Add Access Point Tanaza","Configure-Add Access Point Tanaza"];
a_titles["configure-add-access-point-compatible"]=["Configure - Add Access Point Compatible","Configure-Add Access Point Compatible"];
a_titles["manage-networks"]=["Manage - Networks","Manage-Networks"];
a_titles["manage-ap-coverage"]=["Manage - Access Point Coverage","Manage-Access Point Coverage"];
a_titles["manage-agents"]=["Manage - Manage Agents","Manage-Agents"];
a_titles["manage-install-agent"]=["Manage - Install Agent","Manage-Install Agent"];
a_titles["manage-connector"]=["Manage - Agent Configuration","Manage-Agent Configuration"];
a_titles["account-info"]=["Account - Agent Info","Account-Agent Info"];
a_titles["account-balance"]=["Account - Balance","Account-Balance"];
a_titles["account-credits"]=["Account - Credits","Account-Credits"];
a_titles["account-emailalert"]=["Account - Email Alert","Account-EmailAlert"];

function updateMetaData(section){
    if(a_titles[section]==null){
        document.title=("Tanaza Cloud AP Management | ");
        window.location.hash=escape("");
        return;
    }
    document.title=("Tanaza Cloud AP Management | "+a_titles[section][0]);
    window.location.hash=escape(a_titles[section][1]);
}
/*************************
 * META DATA utilities - END
 *************************/