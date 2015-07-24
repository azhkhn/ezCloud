var dynamicValueAdder_walled=1;
var dynamicValueAdder_mac=1;
var current_aps_offline=0;
/*function submitAddSsid(){
    var value=jQuery("#addSsidName").attr("value");
    loadPage("ajaxLoadConfigureSsid_ssid_add", "name="+escape(value),"exposeFullPage");
}*/

function loadAddSsid(id){
    loadPage("ajaxLoadConfigureSsid_ssid_add","start=true","exposeFullPage");
}
function configure_ssid_settings(id,period){
		//alert("configure_ssid_settings id is " + id);
    var strid=null;
    try{
        strid=$(".subsection").filter(".tabclick").attr("id");
    }catch(err){
            
    }
    if(strid!=null){
        for(var k=0;k<strid.length;k++){
            if(!isNaN(strid.charAt(k))){
                strid=strid.substring(k);
                break;
            }
        }
    }
    else{
        strid="";
    }   
    if(period==null){
        period="";
    }
    //alert("strid is "+strid+" period is "+period);
    loadPage('configure-ssid-settings','id='+id+"&selection="+strid+"&period="+period);
}
function showHideSecurityPasswordFields(){
    if($("#ssid-security-4").attr("checked")=="checked"){
        $("#wpa2pskContainer").show();
    }else{
        $("#wpa2pskContainer").hide();
    }
    if($("#ssid-security-6").attr("checked")=="checked"){
        $("#wepContainer").show();
    }else{
        $("#wepContainer").hide();
    }
    if($("#ssid-security-10").attr("checked")=="checked" || $("#ssid-security-10_1").attr("checked")=="checked" || $("#ssid-security-10_2").attr("checked")=="checked"){
        if($("#ssid-security-10").attr("checked")=="checked"){
            $("#cp_cp_type").attr("value","0");
            $("#radius_ws_10_1").hide();
            $("#radius_ws_10_2").show();
            $(".radiusDetail").hide();
            $(".noradiusDetail").show();
            $(".sessionDetail").show();
        }else{
            if($("#ssid-security-10_2").attr("checked")=="checked"){
                $("#cp_cp_type").attr("value","1");
                $("#ssid-security-10_1").attr("checked","checked");
                $("#radius_ws_10_1").show();
                $("#radius_ws_10_2").hide();
                $(".radiusDetail").show();
                $(".noradiusDetail").hide();
                $(".sessionDetail").hide();
                
            }
        }
        $("#captiveContainer").show();
    }else{
        $("#captiveContainer").hide();
        $("#radius_ws_10_1").hide();
        $("#radius_ws_10_2").show();
    }
    if($("#ssid-security-20").attr("checked")=="checked"){
        $("#subsection2").show();
        $("#subsection3").show();
        $("#subsection5").show();
    }else{
        $("#subsection2").hide();
        $("#subsection3").hide();
        $("#subsection5").hide();
    }
    updateMainSize();
}
function configure_ssid_saveSsidSettings(){
    if(current_aps_offline>0){
        if(!confirm("Please note that "+current_aps_offline+" AP"+(current_aps_offline>1?"s":"")+" connected to this ssid "+(current_aps_offline>1?"are":"is")+" offline. \nIf you proceed they will not be synced with this ssid, you may need to re-add them to this ssid profile.")){
            console.log("Aborting ssid submit");
            return;
        }
        
    }
    if($("#ssid-security-6").attr("checked")=="checked"){
        
        var tmpPassPhrase=$("#wep").attr("value");
        if($("#wep").attr("value")=="text"){
            tmpPassPhrase=$("#wepText").attr("value");
        }
        var wepKey=wepkey64(tmpPassPhrase);        
        $("#key1").attr("value",wepKey[0]);
        $("#key2").attr("value",wepKey[1]);
        $("#key3").attr("value",wepKey[2]);
        $("#key4").attr("value",wepKey[3]);
    }
    if($("#ssid-security-20").attr("checked")=="checked"){
        if(!onTanazaHostedValidation()){
            $("#ssidError").show();
            window.scrollTo(0,0);
            return;
        }
    }
    var params=$("#ssid_info_form").serialize()+"&command=save";
    //loadPage('configure-ssid-settings',params);
    postSsidConfig(params);
}
function postSsidConfig(params){                
                
    params = params+"&action=ajaxLoadConfigureSsid_ssid_settings";
    updateLayout(3);
    var timestampId=new Date().getTime();
    history_ajax[""+timestampId]=new Array(""+timestampId);
    params=params+"&timestampId="+timestampId;
    lastInterruptible=""+timestampId;
    params=params+"&tz="+tsDiff;

    showLoader("menuLevel3");
    showLoader("content");
    $.post(getServer()+"index.php?", params, function(data2) {
        showSection("menuLevel3", data2.menu3);
        showSection("content", data2.content);
        jQuery("#titleText").html(data2.titleText);
        if (data2.postJavascript != null) {
            eval(data2.postJavascript);
        }
        updateMainSize();
        showSecondaryMenu(2,3,false);
    },'jsonp');
    
}
function configure_ssid_deleteSsid(){
    var params=$("#ssid_info_form").serialize()+"&command=delete";
    
    var requestUri = "action=ajaxLoadConfigureSsid_ssid_settings";
    if (params != null) {
        requestUri += "&" + params;
    }
    updateLayout(3);
    showLoader("menuLevel3");
    showLoader("content");
    $.post(getServer()+"index.php?", requestUri, function(data) {
         if (stopExecution(data)) {
            return;
        }
        showSection("menuLevel3", data.menu3);
        showSection("content", data.content);
        jQuery("#titleText").html(data.titleText);
        if (data.postJavascript != null) {
            eval(data.postJavascript);
        }
        updateMainSize();
        showSecondaryMenu(2,3,false);
    },'jsonp');
}
function checkPendingSsidRevision(random,id){
    requestUri = "action=ajaxLoadConfigure_ssid_checkPendingRev&id="+id;
    executeAjaxRequest("index.php?", requestUri,
        // success
        function(data) {
            if (stopExecution(data)) {
                return;
            }
            if($("#ajaxLoadConfigureSsid"+random).attr("value")!="true"){
                return;
            }
            if(data.ssids!=null){
                updateLeftMenuSsidStatus(data.ssids);
            }
            if(data.status=="ok"){
                configure_ssid_settings(id);
            }
            else{
                if(data.count>1){
                    $(".ssidConfigurationSectionCounterMore").show();
                }
                else{
                    $(".ssidConfigurationSectionCounterMore").hide();
                }
                $(".ssidConfigurationSectionCounter").html(data.count);
                if($('#ssidConfigurationSection').attr("value")=="true"){
                    timer=setTimeout("checkPendingSsidRevision("+random+","+id+")",2000);
                }
            }
        },
        // beforeSend
        function(xhr) {
            cleanTimers();
        },null,false);
}
function configureSsidStatus(random,id){
    requestUri = "action=ajaxLoadSsidStatus&id="+((id!=null)?id:"");
    executeAjaxRequest("index.php?", requestUri,
        // success
        function(data) {
            if (stopExecution(data)) {
                return;
            }
            if($("#ajaxLoadConfigureSsid"+random).attr("value")!="true"){
                //alert("stopping");
                return;
            }
            if(data.ssids!=null){
                updateLeftMenuSsidStatus(data.ssids);
            }
            if(data.aps!=null){
                var offlines=0;
                for(var k=0;k<data.aps.length;k++){
                    if(data.aps[k].online==false){
                        offlines++;
                    }
                }
                current_aps_offline=offlines;
                updateLeftMenuApStatus(data.aps);
            }        
            else{
                current_aps_offline=offlines;
            }
            //console.log("Currently offline devices:"+current_aps_offline); 
            timer=setTimeout("configureSsidStatus('"+random+"'"+((id!=null)?",'"+id+"'":"")+")",2000);            
            updateMainSize();
        },
        // beforeSend
        function(xhr) {
            cleanTimers();
        },null,false);
}
function updateValidationWepKey(event,element){
    avoidSubmit(event);
    if(element.value.length!=5){
        showError("#wep");
        showError("#wepText");
    }
    else{
        cleanField("#wep");
        cleanField("#wepText");
    }
}
function updateValidationWpapsk2Key(event,element){
    avoidSubmit(event);
    if(element.value.length<8){
        showError("#wpa2psk");
        showError("#wpa2pskText");
    }
    else{
        cleanField("#wpa2psk");
        cleanField("#wpa2pskText");
    }
}
function padTo64(val)
{
    var ret="";
    var x;
    var rep;
    rep = 1 + (64 / (val.length));
    for (x = 0; x < rep; x++)
    {
        ret = ret + val;
    };
    return ret.substring(0,64);
};

function wepkey128(val)
{
    var ret = hex_md5(padTo64(val));
    ret = ret.substring(0,26);
    return ret.toUpperCase(); 
};

// converts one byte to a 2 chars hex string
function bin2hex(val)
{
    var hex = "0123456789ABCDEF";
    var result = "";
    var index;
    index = (val >> 4) & 0x0f;
    result = result + hex.substring(index, index+1);
    index = val & 0x0f;
    result = result + hex.substring(index, index+1);
    return result;
}

function wepkey64(val){
    var pseed  = new Array(4);
    pseed[0] = 0;
    pseed[1] = 0;
    pseed[2] = 0;
    pseed[3] = 0;
    var randNumber;
    var k64 = new Array(4);
    k64[0] = "";
    k64[1] = "";
    k64[2] = "";
    k64[3] = "";
    var i, j, tmp;
    for (i = 0; i < val.length; i++){
        pseed[i%4] ^= val.charCodeAt(i);
    }
    randNumber = pseed[0] | (pseed[1] << 8) | (pseed[2] << 16) | (pseed[3] << 24);
    for (i = 0; i < 4; i++){
        for (j = 0; j < 5; j++){
            randNumber = (randNumber * 0x343fd + 0x269ec3) & 0xffffffff;
            tmp = (randNumber >> 16) & 0xff;
            k64[i] += bin2hex(tmp);
        }
    }
    return k64;
}
function generateSubmit(element,event,section){
    if(event.keyCode == 13){
        addAllowedValue(section);
    //$(element).blur();
    }
    
}
function generateOnBlurSubmit(element,section){
    if(element.value!= ''){
        addAllowedValue(section);
    }
}
function addAllowedValue(section,silent,inputvalue){
    if(silent==null){
        silent=false;
    }
    var value=$("#addallowed"+section).attr("value");
    if(isBlankOrNull(value) && inputvalue==null){
        alert('Please specify a value');
    }
    else{
        if(inputvalue!=null){
            value=inputvalue;
        }
        if(section=='walled'){
            // new check      ^(([^:/?#]+):)?((\/\/)?([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$
            var pattern = new RegExp(/^(([^:/?#]+):)?((\/\/)?([^/?# ]*))?([^?# ]*)(\?([^#]*))?(#(.*))?$/i);
            var m = pattern.exec(value);
            if(m!=null){
                if(m[5]==null){
                    if(!silent){
                        alert('Please specify a valid hostname, without http:// or https:// )');
                    }
                    return;
                }
                //value=m[5]+(m[6]!=null?(m[6]+(m[7]!=null?m[7]:"")):"");
                value=m[5]+(m[6]!=null?(m[6]):"");
                //check if duplicated value
                var alreadyAdded=$("#allowedwalledContainer input[name^='value_walled']")
                for(var t=0;t<alreadyAdded.length;t++){
                    if($(alreadyAdded[t]).attr("value")==value){
                        if(!silent){
                            alert('This value is already present in the walled garden');
                        }
                        return;
                    }
                }
            }
            else{
                if(!silent){
                    alert('Please specify a valid hostname, without http:// or https:// )');
                }
                return;
            }
            console.log(value);
        }
        if(section=='mac'){
            if(!isValidMac(value)){
                if(!silent){
                    alert('Please specify a valid mac address. Example: 00:11:22:33:44:55 ');
                }
                return;
            }
        }
        var counter=0;
        if(section=='walled'){
            dynamicValueAdder_walled++;
            counter=dynamicValueAdder_walled;
        }
        if(section=='mac'){
            dynamicValueAdder_mac++;
            counter=dynamicValueAdder_mac;
        }
        
        var text='<div class="allowed'+section+'Div"><img src="'+getWalledGardenIconForDomain(value)+'" style="width:20px;vertical-align:middle"><input type="text" readonly="readonly" name="value_'+section+'_'+counter+'" style="width: 250px" value="'+trim(value)+'" class="active_input idleField"/> <img onclick="deleteAllowedValue(\'walled\',this)" src="static/images/mini-delete.png" width="20px" style="vertical-align: middle"/></div>';
        $("#allowed"+section+"Container").prepend(text);
        $("#addallowed"+section).attr("value","");
        showHideWalledNoDomainNotice();
        updateMainSize();
    }
}
function getWalledGardenIconForDomain(value){
    var i=0;
    for(i=0;i<domainsFacebook.length;i++){
        if(domainsFacebook[i]==value){
           return "static/images/auth/over/facebook.png"; 
        }
    }
    for(i=0;i<domainsLinkedin.length;i++){
        if(domainsLinkedin[i]==value){
           return "static/images/auth/over/linkedin.png"; 
        }
    }
    for(i=0;i<domainsTwitter.length;i++){
        if(domainsTwitter[i]==value){
           return "static/images/auth/over/twitter.png"; 
        }
    }
    for(i=0;i<domainsGoogle.length;i++){
        if(domainsGoogle[i]==value){
           return "static/images/auth/over/google.png"; 
        }
    }
    for(i=0;i<domainsInstagram.length;i++){
        if(domainsInstagram[i]==value){
           return "static/images/auth/over/instagram.png"; 
        }
    }
    for(i=0;i<domainsLive.length;i++){
        if(domainsLive[i]==value){
           return "static/images/auth/over/live.png"; 
        }
    }
    for(i=0;i<domainsNoPopup.length;i++){
        if(domainsNoPopup[i]==value){
           return "static/images/nopopup.png"; 
        }
    }
    return "static/images/blank.png"; 
}
function deleteAllowedValue(section,element){
    $(element).parent().remove();
    showHideWalledNoDomainNotice();
    updateMainSize();
}
function updateSessionTimeout(valuex){
    console.log("updateSessionTimeout to "+( parseInt(valuex+"")+1));
    selectWrapperSetValue("#sessionTimeoutRadius", parseInt(valuex+"")+1);
}
function updateRadiusSessionTimeout(valuex){
    console.log("updateRadiusSessionTimeout to "+( parseInt(valuex+"")+1));
    if(parseInt(valuex)==0){        
        selectWrapperSetValue("#sessionTimeout", 0);
    }
    else{
        selectWrapperSetValue("#sessionTimeout", parseInt(valuex+"")-1);
    }
}
function updateIdleTimeout(valuex){
    selectWrapperSetValue("#idleTimeoutRadius", parseInt(valuex+"")+1);
}
function updateRadiusIdleTimeout(valuex){
    if(parseInt(valuex)==0){        
        selectWrapperSetValue("#idleTimeout", 0);
    }
    else{
        selectWrapperSetValue("#idleTimeout", parseInt(valuex+"")-1);
    }
}
function addSocialWalledGarden(social){
    var domainsToAdd=new Array();
    switch(social){
        case 'facebook':
            domainsToAdd=domainsFacebook;
            break;
        case 'linkedin':
            domainsToAdd=domainsLinkedin;
            break;
        case 'twitter':
            domainsToAdd=domainsTwitter;
            break;
        case 'google':
            domainsToAdd=domainsGoogle;
            break;
        case 'instagram':
            domainsToAdd=domainsInstagram;
            break;
        case 'live':
            domainsToAdd=domainsLive;
            break;
        case 'nopopup':
            domainsToAdd=domainsNoPopup;
            break;
    }
    var i=0;
    for(i=0;i<domainsToAdd.length;i++){
        var currentWalled=$("#allowedwalledContainer input[name^='value_walled']");
        for(var t=0;t<currentWalled.length;t++){
            if($(currentWalled[t]).attr("value")==domainsToAdd[i]){
                $(currentWalled[t]).parent().remove();
                break;
            }
        }
    }
    //remove all values
    for(i=0;i<domainsToAdd.length;i++){
        addAllowedValue('walled',true,domainsToAdd[i]);
    }
    showHideWalledNoDomainNotice();
    updateMainSize();
}
function showHideWalledNoDomainNotice(){
    var currentWalled=$("#allowedwalledContainer input[name^='value_walled']");
    if(currentWalled.length>0){
        $(".walled_nodomain").hide();
        $(".walled_domain").show();
    }
    else{
        $(".walled_nodomain").show();
        $(".walled_domain").hide();
    }
}
function clearWalledGarden(){
    var currentWalled=$("#allowedwalledContainer input[name^='value_walled']");
    $(currentWalled).parent().remove();
    showHideWalledNoDomainNotice();
    updateMainSize();
}
function updateSplashPagePreview(){
    var tzcp_customization_stripe_text_color=$("#tzcp_customization_stripe_text_color").attr("value");
    if(tzcp_customization_stripe_text_color!=null && tzcp_customization_stripe_text_color!='' && isValidColor(tzcp_customization_stripe_text_color)){
        $("#wrapperStripe").css("color",tzcp_customization_stripe_text_color);   
        $("#tzcp_customization_stripe_text_color_prev").css("background-color",tzcp_customization_stripe_text_color);
    }
    else{
        $("#wrapperStripe").css("color","black");  
        $("#tzcp_customization_stripe_text_color_prev").css("background-color",tzcp_customization_stripe_text_color);
    }
    var tzcp_customization_stripe_background_color=$("#tzcp_customization_stripe_background_color").attr("value");
    if(tzcp_customization_stripe_background_color!=null && tzcp_customization_stripe_background_color!='' && isValidColor(tzcp_customization_stripe_background_color)){
        $("#wrapperStripe").css("background-color",tzcp_customization_stripe_background_color);   
        $("#tzcp_customization_stripe_background_color_prev").css("background-color",tzcp_customization_stripe_background_color);
    }
    else{
        $("#wrapperStripe").css("background-color","");  
        $("#tzcp_customization_stripe_background_color_prev").css("background-color",tzcp_customization_stripe_background_color);
    }
    var tzcp_customization_background_color=$("#tzcp_customization_background_color").attr("value");
    if(tzcp_customization_background_color!=null && tzcp_customization_background_color!='' && isValidColor(tzcp_customization_background_color)){
        $("#wrapperDiv").css("background-color",tzcp_customization_background_color);
        $("#tzcp_customization_background_color_prev").css("background-color",tzcp_customization_background_color);
    }
    else{
        $("#wrapperDiv").css("background-color","");  
        $("#tzcp_customization_background_color_prev").css("background-color",tzcp_customization_background_color);
    }
    
    var tzcp_customization_footer_text_color=$("#tzcp_customization_footer_text_color").attr("value");
    if(tzcp_customization_footer_text_color!=null && tzcp_customization_footer_text_color!='' && isValidColor(tzcp_customization_footer_text_color)){
        $("#wrapperFooter").css("color",tzcp_customization_footer_text_color);  
        $("#wrapperLangs").css("color",tzcp_customization_footer_text_color);  
        
        $("#tzcp_customization_footer_text_color_prev").css("background-color",tzcp_customization_footer_text_color);
    }
    else{
        $("#wrapperFooter").css("color","#333333");  
        $("#wrapperLangs").css("color","#333333");  
        
        $("#tzcp_customization_footer_text_color_prev").css("background-color",tzcp_customization_footer_text_color);
    }
    var tzcp_customization_footer_background_color=$("#tzcp_customization_footer_background_color").attr("value");
    if(tzcp_customization_footer_background_color!=null && tzcp_customization_footer_background_color!='' && isValidColor(tzcp_customization_footer_background_color)){
        $("#wrapperFooter").css("background-color",tzcp_customization_footer_background_color);  
        $("#tzcp_customization_footer_background_color_prev").css("background-color",tzcp_customization_footer_background_color);
    }
    else{
        $("#wrapperFooter").css("background-color",""); 
        $("#tzcp_customization_footer_background_color_prev").css("background-color",tzcp_customization_footer_background_color);
    }
    if($("#tzcp_customization_language_en").is(":checked") || $("#tzcp_customization_language_ita").is(":checked")|| $("#tzcp_customization_language_spain").is(":checked")|| $("#tzcp_customization_language_por").is(":checked")|| $("#tzcp_customization_language_nor").is(":checked")){
        $("#wrapperLangs").show();
    }
    else{
        $("#wrapperLangs").hide();
    }
    if($("#tzcp_customization_language_en").is(":checked")){
        $("#wrapperLangEng").show();
    }
    else{
        $("#wrapperLangEng").hide();
    }
    if($("#tzcp_customization_language_ita").is(":checked")){
        $("#wrapperLangIta").show();
    }
    else{
        $("#wrapperLangIta").hide();
    }
    if($("#tzcp_customization_language_spain").is(":checked")){
        $("#wrapperLangSpa").show();
    }
    else{
        $("#wrapperLangSpa").hide();
    }
    if($("#tzcp_customization_language_por").is(":checked")){
        $("#wrapperLangPor").show();
    }
    else{
        $("#wrapperLangPor").hide();
    }
    if($("#tzcp_customization_language_nor").is(":checked")){
        $("#wrapperLangNor").show();
    }
    else{
        $("#wrapperLangNor").hide();
    }
    var logourl=$("#tzcp_customization_logo_url").attr("value");
    $("#wrapperLogo").attr("src",logourl);
    var backurl=$("#tzcp_customization_background_url").attr("value");
    $("#wrapperDiv").css("background-image","url('"+backurl+"')");
    var footerlogurlobj=$("#tzcp_customization_footer_logo_url");
    if(footerlogurlobj===null || footerlogurlobj.length===0){
        $("#wrapperFooterLogoTP").show();
    }else{
        $("#wrapperFooterLogoTP").hide();
        var footerlogourl=$("#tzcp_customization_footer_logo_url").attr("value");
        if(isBlankOrNull(footerlogourl)){
            $("#wrapperFooterLogo").attr("src","static/images/blank.png");
        }
        else{
            $("#wrapperFooterLogo").attr("src",footerlogourl);
        } 
    }
       
    /* Social Images */
    if($("#tzcp_customization_connect_login").is(":checked")){
        $("#wrapperConnectLogin").show();
    }
    else{
        $("#wrapperConnectLogin").hide();
    }
    if($("#tzcp_customization_facebook_login").is(":checked")){
        $("#wrapperSocialFacebook").show();
    }
    else{
        $("#wrapperSocialFacebook").hide();
    }
    if($("#tzcp_customization_google_login").is(":checked")){
        $("#wrapperSocialGoogle").show();
    }
    else{
        $("#wrapperSocialGoogle").hide();
    }
    if($("#tzcp_customization_linkedin_login").is(":checked")){
        $("#wrapperSocialLinkedin").show();
    }
    else{
        $("#wrapperSocialLinkedin").hide();
    }
    if($("#tzcp_customization_twitter_login").is(":checked")){
        $("#wrapperSocialTwitter").show();
    }
    else{
        $("#wrapperSocialTwitter").hide();
    }
    if($("#tzcp_customization_instagram_login").is(":checked")){
        $("#wrapperSocialInstagram").show();
    }
    else{
        $("#wrapperSocialInstagram").hide();
    }
    if($("#tzcp_customization_live_login").is(":checked")){
        $("#wrapperSocialLive").show();
    }
    else{
        $("#wrapperSocialLive").hide();
    }
    if($("#tzcp_customization_connectsimple_email").is(":checked")){
        $("#wrapperConnectSimpleEmail").show();
    }
    else{
        $("#wrapperConnectSimpleEmail").hide();
    }
    if($("#tzcp_customization_connectsimple_phone").is(":checked")){
        $("#wrapperConnectSimplePhone").show();
    }
    else{
        $("#wrapperConnectSimplePhone").hide();
    }
    if($("#tzcp_customization_connectsimple_emailphone").is(":checked")){
        $("#wrapperConnectSimpleEmailPhone").show();
    }
    else{
        $("#wrapperConnectSimpleEmailPhone").hide();
    }
    if($("#tzcp_customization_connectsimple_code").is(":checked")){
        $("#wrapperConnectSimpleCode").show();
    }
    else{
        $("#wrapperConnectSimpleCode").hide();
    }
    var tzcp_customization_facebook_button_url=$("#tzcp_customization_facebook_button_url").attr("value");
    if(tzcp_customization_facebook_button_url.length==0){
        $("#wrapperSocialFacebook").attr("src","static/images/auth/over/facebook-micro.png");
        $("#facebookPreview").attr("src","static/images/auth/over/facebook-micro.png");
    }
    else{
        $("#wrapperSocialFacebook").attr("src",tzcp_customization_facebook_button_url);
        $("#facebookPreview").attr("src",tzcp_customization_facebook_button_url);
    }
    var tzcp_customization_google_button_url=$("#tzcp_customization_google_button_url").attr("value");
    if(tzcp_customization_google_button_url.length==0){
        $("#wrapperSocialGoogle").attr("src","static/images/auth/over/google-micro.png");
        $("#googlePreview").attr("src","static/images/auth/over/google-micro.png");
    }
    else{
        $("#wrapperSocialGoogle").attr("src",tzcp_customization_google_button_url);
        $("#googlePreview").attr("src",tzcp_customization_google_button_url);
    }
    var tzcp_customization_linkedin_button_url=$("#tzcp_customization_linkedin_button_url").attr("value");
    if(tzcp_customization_linkedin_button_url.length==0){
        $("#wrapperSocialLinkedin").attr("src","static/images/auth/over/linkedin-micro.png");
        $("#linkedinPreview").attr("src","static/images/auth/over/linkedin-micro.png");
    }
    else{
        $("#wrapperSocialLinkedin").attr("src",tzcp_customization_linkedin_button_url);
        $("#linkedinPreview").attr("src",tzcp_customization_linkedin_button_url);
    }
    var tzcp_customization_twitter_button_url=$("#tzcp_customization_twitter_button_url").attr("value");
    if(tzcp_customization_twitter_button_url.length==0){
        $("#wrapperSocialTwitter").attr("src","static/images/auth/over/twitter-micro.png");
        $("#twitterPreview").attr("src","static/images/auth/over/twitter-micro.png");
    }
    else{
        $("#wrapperSocialTwitter").attr("src",tzcp_customization_twitter_button_url);
        $("#twitterPreview").attr("src",tzcp_customization_twitter_button_url);
    }
    var tzcp_customization_instagram_button_url=$("#tzcp_customization_instagram_button_url").attr("value");
    if(tzcp_customization_instagram_button_url.length==0){
        $("#wrapperSocialInstagram").attr("src","static/images/auth/over/instagram-micro.png");
        $("#instagramPreview").attr("src","static/images/auth/over/instagram-micro.png");
    }
    else{
        $("#wrapperSocialInstagram").attr("src",tzcp_customization_instagram_button_url);
        $("#instagramPreview").attr("src",tzcp_customization_instagram_button_url);
    }
    var tzcp_customization_live_button_url=$("#tzcp_customization_live_button_url").attr("value");
    if(tzcp_customization_live_button_url.length==0){
        $("#wrapperSocialLive").attr("src","static/images/auth/over/live-micro.png");
        $("#livePreview").attr("src","static/images/auth/over/live-micro.png");
    }
    else{
        $("#wrapperSocialLive").attr("src",tzcp_customization_live_button_url);
        $("#livePreview").attr("src",tzcp_customization_live_button_url);
    }
    /**
     * Pass through button customizations
     */
    var array=new Array("eng","ita","esp","por","nor");
    for(k=0;k<array.length;k++){
        var tzcp_customization_coonect_url=$("#tzcp_customization_connect_url_"+array[k]).attr("value");
        if(tzcp_customization_coonect_url!=null && tzcp_customization_coonect_url.length==0){
            $("#connectPreview_"+array[k]).attr("src","static/images/connectbtn.png");
            if(k==0){
                $("#wrapperConnectLogin").attr("src","static/images/connectbtn.png");
            }
        }
        else{
            $("#connectPreview_"+array[k]).attr("src",tzcp_customization_coonect_url);
            if(k==0){
                $("#wrapperConnectLogin").attr("src",tzcp_customization_coonect_url);
            }
        }
    }
}
function onTanazaHostedChange(){    
    /** 
     * Client Redirect Radio
     */
    if($("#tzcp_client_redirect_type0").is(":checked")){
        $("#tzcp_client_redirect_url").attr("disabled","disabled");
    }
    else{
        $("#tzcp_client_redirect_url").removeAttr("disabled");
    }
    /** 
     * Terms And Conditions
     */
    if($("#tzcp_customization_show_terms").is(":checked")){
        $(".sectionShowTerms").show();
    }
    else{
        $(".sectionShowTerms").hide();
    }
    /** 
     * Terms And Conditions
     */
    if($("#tzcp_customization_roaming").is(":checked")){
        $(".sectionRoaming").show();
    }
    else{
        $(".sectionRoaming").hide();
    }
     /**
     * Pass-through button
     */
    if($("#tzcp_customization_connect_cust0").is(":checked")){
        $(".sectionConnectCust1").hide();
        $(".sectionConnectCust2").hide();
    }
    else{
        if($("#tzcp_customization_connect_cust1").is(":checked")){
            $(".sectionConnectCust1").show();
            $(".sectionConnectCust2").hide();
        }
        else{
            $(".sectionConnectCust1").hide();
            $(".sectionConnectCust2").show();
        }
    }
    
    /**
     * Social logins
     */
    if($("#tzcp_customization_facebook_login").is(":checked")){
        $(".sectionFacebookLogin .socialAppCredential").removeAttr("disabled");
        $(".fbactions").show();
    }
    else{
        $(".sectionFacebookLogin .socialAppCredential").attr("disabled","disabled");
        $(".fbactions").hide();
    }
    if($("#tzcp_customization_google_login").is(":checked")){
        $(".sectionGoogleLogin .socialAppCredential").removeAttr("disabled");        
    }
    else{
        $(".sectionGoogleLogin .socialAppCredential").attr("disabled","disabled");
    }
    if($("#tzcp_customization_linkedin_login").is(":checked")){
        $(".sectionLinkedinLogin .socialAppCredential").removeAttr("disabled");
    }
    else{
        $(".sectionLinkedinLogin .socialAppCredential").attr("disabled","disabled");
    }
    if($("#tzcp_customization_twitter_login").is(":checked")){
        $(".sectionTwitterLogin .socialAppCredential").removeAttr("disabled");
    }
    else{
        $(".sectionTwitterLogin .socialAppCredential").attr("disabled","disabled");
    }
    if($("#tzcp_customization_instagram_login").is(":checked")){
        $(".sectionInstagramLogin .socialAppCredential").removeAttr("disabled");
    }
    else{
        $(".sectionInstagramLogin .socialAppCredential").attr("disabled","disabled");
    }
    if($("#tzcp_customization_live_login").is(":checked")){
        //$(".sectionLiveLogin .socialAppCredential").removeAttr("disabled");
    }
    else{
        //$(".sectionLiveLogin .socialAppCredential").attr("disabled","disabled");
    }
    /**
     * Facebook social actions
     */
    if($("#tzcp_customization_facebook_socialaction0").is(":checked")){
        $(".sectionFacebookSocialAction1").hide();
        $(".sectionFacebookSocialAction2").hide();
        $(".sectionFacebookSocialAction3").hide();
        $("#fbResponseLike").hide();
        
    }
    else{
        if($("#tzcp_customization_facebook_socialaction2").is(":checked")){
            $(".sectionFacebookSocialAction1").hide();
            $(".sectionFacebookSocialAction2").show();
            $(".sectionFacebookSocialAction3").hide();
            $("#fbResponseLike").hide();
        }
        else{
            if($("#tzcp_customization_facebook_socialaction3").is(":checked")){
                $(".sectionFacebookSocialAction1").hide();
                $(".sectionFacebookSocialAction2").hide();
                $(".sectionFacebookSocialAction3").show();
                $("#fbResponseLike").hide();
            }
            else{
                $(".sectionFacebookSocialAction1").show();
                $(".sectionFacebookSocialAction2").hide();
                $(".sectionFacebookSocialAction3").hide();
                $("#fbResponseLike").show();
            }
            
        }
    }
    /**
     * Advertisements
     */
    if($("#tzcp_customization_advertisement0").is(":checked")){
        $(".sectionAdvertisement1").hide();
        $(".sectionAdvertisement2").hide();
    }
    else{
        if($("#tzcp_customization_advertisement1").is(":checked")){
            $(".sectionAdvertisement1").show();
            $(".sectionAdvertisement2").hide();
        }
        else{
            if($("#tzcp_customization_advertisement2").is(":checked")){
                $(".sectionAdvertisement1").hide();
                $(".sectionAdvertisement2").show();
            }
        }
    }
    onTanazaHostedValidation();
    updateSplashPagePreview();
}
function hasWhiteSpace(s) {
  return s.indexOf(' ') >= 0;
}
function hasForwardSlash(s) {
  return s.indexOf('/') >= 0;
}
function onTanazaHostedValidation(){
    var valid=true;
    /** 
     * Client Redirect Radio
     */
    if($("#tzcp_client_redirect_type0").is(":checked")){
        $("#tzcp_client_redirect_url").removeClass("errorField");
    }
    else{
        var tzcp_client_redirect_url=$("#tzcp_client_redirect_url").attr("value");
        if(isBlankOrNull(tzcp_client_redirect_url) || !isValidUrl(tzcp_client_redirect_url)){
            $("#tzcp_client_redirect_url").addClass("errorField");
            valid = false;
        }
        else{
            $("#tzcp_client_redirect_url").removeClass("errorField");
        }
    }
    /**
     * Social logins
     */
    if($("#tzcp_customization_facebook_login").is(":checked")){
        $("#tzcp_customization_facebook_id").removeClass("errorField");
        $("#tzcp_customization_facebook_secret").removeClass("errorField");
        if(hasWhiteSpace($("#tzcp_customization_facebook_id").attr("value"))) {
            $("#tzcp_customization_facebook_id").addClass("errorField");
            valid = false;
        }
        if(hasWhiteSpace($("#tzcp_customization_facebook_secret").attr("value"))) {
            $("#tzcp_customization_facebook_secret").addClass("errorField");
            valid = false;
        }
        if(!isBlankOrNull($("#tzcp_customization_facebook_id").attr("value")) && isBlankOrNull($("#tzcp_customization_facebook_secret").attr("value"))){
            $("#tzcp_customization_facebook_secret").addClass("errorField");
            valid = false;
        }
        if(!isBlankOrNull($("#tzcp_customization_facebook_secret").attr("value")) && isBlankOrNull($("#tzcp_customization_facebook_id").attr("value"))){
            $("#tzcp_customization_facebook_id").addClass("errorField");
            valid = false;
        }
        $(".sectionFacebookLogin").show();        
    }
    else{
        $("#tzcp_customization_facebook_id").removeClass("errorField");
        $("#tzcp_customization_facebook_secret").removeClass("errorField");
        $(".sectionFacebookLogin").hide();
    }
    if($("#tzcp_customization_google_login").is(":checked")){
        $("#tzcp_customization_google_id").removeClass("errorField");
        $("#tzcp_customization_google_secret").removeClass("errorField");
        if(hasWhiteSpace($("#tzcp_customization_google_id").attr("value"))) {
            $("#tzcp_customization_google_id").addClass("errorField");
            valid = false;
        }
        if(hasWhiteSpace($("#tzcp_customization_google_secret").attr("value"))) {
            $("#tzcp_customization_google_secret").addClass("errorField");
            valid = false;
        }
        if(!isBlankOrNull($("#tzcp_customization_google_id").attr("value")) && isBlankOrNull($("#tzcp_customization_google_secret").attr("value"))){
            $("#tzcp_customization_google_secret").addClass("errorField");
            valid = false;
        }
        if(!isBlankOrNull($("#tzcp_customization_google_secret").attr("value")) && isBlankOrNull($("#tzcp_customization_google_id").attr("value"))){
            $("#tzcp_customization_google_id").addClass("errorField");
            valid = false;
        }
        $(".sectionGoogleLogin").show();
    }
    else{
        $("#tzcp_customization_google_id").removeClass("errorField");
        $("#tzcp_customization_google_secret").removeClass("errorField");
        $(".sectionGoogleLogin").hide();
    }
    if($("#tzcp_customization_linkedin_login").is(":checked")){        
        $("#tzcp_customization_linkedin_id").removeClass("errorField");
        $("#tzcp_customization_linkedin_secret").removeClass("errorField");
        if(hasWhiteSpace($("#tzcp_customization_linkedin_id").attr("value"))) {
            $("#tzcp_customization_linkedin_id").addClass("errorField");
            valid = false;
        }
        if(hasWhiteSpace($("#tzcp_customization_linkedin_secret").attr("value"))) {
            $("#tzcp_customization_linkedin_secret").addClass("errorField");
            valid = false;
        }
        if(!isBlankOrNull($("#tzcp_customization_linkedin_id").attr("value")) && isBlankOrNull($("#tzcp_customization_linkedin_secret").attr("value"))){
            $("#tzcp_customization_linkedin_secret").addClass("errorField");
            valid = false;
        }
        if(!isBlankOrNull($("#tzcp_customization_linkedin_secret").attr("value")) && isBlankOrNull($("#tzcp_customization_linkedin_id").attr("value"))){
            $("#tzcp_customization_linkedin_id").addClass("errorField");
            valid = false;
        }
        $(".sectionLinkedinLogin").show();
    }
    else{
        $("#tzcp_customization_linkedin_id").removeClass("errorField");
        $("#tzcp_customization_linkedin_secret").removeClass("errorField");
        $(".sectionLinkedinLogin").hide();
    }
    if($("#tzcp_customization_twitter_login").is(":checked")){
        $("#tzcp_customization_twitter_id").removeClass("errorField");
        $("#tzcp_customization_twitter_secret").removeClass("errorField");
        if(hasWhiteSpace($("#tzcp_customization_twitter_id").attr("value"))) {
            $("#tzcp_customization_twitter_id").addClass("errorField");
            valid = false;
        }
        if(hasWhiteSpace($("#tzcp_customization_twitter_secret").attr("value"))) {
            $("#tzcp_customization_twitter_secret").addClass("errorField");
            valid = false;
        }
        if(!isBlankOrNull($("#tzcp_customization_twitter_id").attr("value")) && isBlankOrNull($("#tzcp_customization_twitter_secret").attr("value"))){
            $("#tzcp_customization_twitter_secret").addClass("errorField");
            valid = false;
        }
        if(!isBlankOrNull($("#tzcp_customization_twitter_secret").attr("value")) && isBlankOrNull($("#tzcp_customization_twitter_id").attr("value"))){
            $("#tzcp_customization_twitter_id").addClass("errorField");
            valid = false;
        }
        $(".sectionTwitterLogin").show();
    }
    else{
        $("#tzcp_customization_twitter_id").removeClass("errorField");
        $("#tzcp_customization_twitter_secret").removeClass("errorField");
        $(".sectionTwitterLogin").hide();
    }
    if($("#tzcp_customization_instagram_login").is(":checked")){
        $("#tzcp_customization_instagram_id").removeClass("errorField");
        $("#tzcp_customization_instagram_secret").removeClass("errorField");
        if(hasWhiteSpace($("#tzcp_customization_instagram_id").attr("value"))) {
            $("#tzcp_customization_instagram_id").addClass("errorField");
            valid = false;
        }
        if(hasWhiteSpace($("#tzcp_customization_instagram_secret").attr("value"))) {
            $("#tzcp_customization_instagram_secret").addClass("errorField");
            valid = false;
        }
        if(!isBlankOrNull($("#tzcp_customization_instagram_id").attr("value")) && isBlankOrNull($("#tzcp_customization_instagram_secret").attr("value"))){
            $("#tzcp_customization_instagram_secret").addClass("errorField");
            valid = false;
        }
        if(!isBlankOrNull($("#tzcp_customization_instagram_secret").attr("value")) && isBlankOrNull($("#tzcp_customization_instagram_id").attr("value"))){
            $("#tzcp_customization_instagram_id").addClass("errorField");
            valid = false;
        }
        $(".sectionInstagramLogin").show();
    }
    else{
        $("#tzcp_customization_instagram_id").removeClass("errorField");
        $("#tzcp_customization_instagram_secret").removeClass("errorField");
        $(".sectionInstagramLogin").hide();
    }
    if($("#tzcp_customization_live_login").is(":checked")){
        /*$("#tzcp_customization_live_id").removeClass("errorField");
        $("#tzcp_customization_live_secret").removeClass("errorField");
        if(hasWhiteSpace($("#tzcp_customization_live_id").attr("value"))) {
            $("#tzcp_customization_live_id").addClass("errorField");
            valid = false;
        }
        if(hasWhiteSpace($("#tzcp_customization_live_secret").attr("value"))) {
            $("#tzcp_customization_live_secret").addClass("errorField");
            valid = false;
        }
        if(!isBlankOrNull($("#tzcp_customization_live_id").attr("value")) && isBlankOrNull($("#tzcp_customization_live_secret").attr("value"))){
            $("#tzcp_customization_live_secret").addClass("errorField");
            valid = false;
        }
        if(!isBlankOrNull($("#tzcp_customization_live_secret").attr("value")) && isBlankOrNull($("#tzcp_customization_live_id").attr("value"))){
            $("#tzcp_customization_live_id").addClass("errorField");
            valid = false;
        }*/
        $(".sectionLiveLogin").show();
    }
    else{
        $(".sectionLiveLogin").hide();
        /*$("#tzcp_customization_live_id").removeClass("errorField");
        $("#tzcp_customization_live_secret").removeClass("errorField");*/
    }
    if($("#tzcp_customization_facebook_socialaction2").is(":checked")){
        if(isBlankOrNull($("#tzcp_customization_facebook_socialaction_post_message").val())){
            $("#tzcp_customization_facebook_socialaction_post_message").addClass("errorField");
            valid = false;
        }
        else{
            $("#tzcp_customization_facebook_socialaction_post_message").removeClass("errorField");
        }
        if($("#tzcp_customization_facebook_socialaction_post_link").length>0 && !isBlankOrNull($("#tzcp_customization_facebook_socialaction_post_link").val()) && !isValidUrl($("#tzcp_customization_facebook_socialaction_post_link").val())){
            $("#tzcp_customization_facebook_socialaction_post_link").addClass("errorField");
            valid = false;
        }
        else{
            $("#tzcp_customization_facebook_socialaction_post_link").removeClass("errorField");
        }
        if($("#tzcp_customization_facebook_socialaction_post_image").length>0 && !isBlankOrNull($("#tzcp_customization_facebook_socialaction_post_image").val()) && !isValidUrl($("#tzcp_customization_facebook_socialaction_post_image").val())){
            $("#tzcp_customization_facebook_socialaction_post_image").addClass("errorField");
            valid = false;
        }
        else{
            $("#tzcp_customization_facebook_socialaction_post_image").removeClass("errorField");
        }
    }
    else{
        if($("#tzcp_customization_facebook_socialaction1").is(":checked")){
            if(isBlankOrNull($("#tzcp_customization_facebook_socialaction_page_url").attr("value")) || $("#tzcp_customization_facebook_socialaction_page_url").attr("value").indexOf("?")!=-1 || $("#tzcp_customization_facebook_socialaction_page_url").attr("value").indexOf(" ")!=-1 || hasForwardSlash($("#tzcp_customization_facebook_socialaction_page_url").attr("value"))){
                $("#tzcp_customization_facebook_socialaction_page_url").addClass("errorField");
                valid = false;
            }
            else{
                $("#tzcp_customization_facebook_socialaction_page_url").removeClass("errorField");
            }
        }else{
           if($("#tzcp_customization_facebook_socialaction3").is(":checked")){
                if(isBlankOrNull($("#tzcp_customization_facebook_socialaction_checkin_page_url").attr("value")) || $("#tzcp_customization_facebook_socialaction_checkin_page_url").attr("value").indexOf("?")!=-1 || $("#tzcp_customization_facebook_socialaction_checkin_page_url").attr("value").indexOf(" ")!=-1 || hasForwardSlash($("#tzcp_customization_facebook_socialaction_checkin_page_url").attr("value"))){
                    $("#tzcp_customization_facebook_socialaction_checkin_page_url").addClass("errorField");
                    valid = false;
                }
                else{
                    $("#tzcp_customization_facebook_socialaction_checkin_page_url").removeClass("errorField");
                }
            }  
        }
    }
    var tzcp_custom_logo_url=$("#tzcp_customization_logo_url").attr("value");    
    if(!isBlankOrNull(tzcp_custom_logo_url) && !isValidUrl(tzcp_custom_logo_url)){
        $("#tzcp_customization_logo_url").addClass("errorField");
        valid = false;
    }
    else{
        $("#tzcp_customization_logo_url").removeClass("errorField");
    }
    var tzcp_customization_background_url=$("#tzcp_customization_background_url").attr("value");
    if(!isBlankOrNull(tzcp_customization_background_url) && !isValidUrl(tzcp_customization_background_url)){
        $("#tzcp_customization_background_url").addClass("errorField");
        valid = false;
    }
    else{
        $("#tzcp_customization_background_url").removeClass("errorField");
    }
    /** 
     * Colors
     */
    var tzcp_customization_background_color=$("#tzcp_customization_background_color").attr("value");
    if(!isBlankOrNull(tzcp_customization_background_color) && !isValidColor(tzcp_customization_background_color)){
        $("#tzcp_customization_background_color").addClass("errorField");
        valid = false;
    }
    else{
        $("#tzcp_customization_background_color").removeClass("errorField");
    }
    var tzcp_customization_stripe_text_color=$("#tzcp_customization_stripe_text_color").attr("value");
    if(!isBlankOrNull(tzcp_customization_stripe_text_color) && !isValidColor(tzcp_customization_stripe_text_color)){
        $("#tzcp_customization_stripe_text_color").addClass("errorField");
        valid = false;
    }
    else{
        $("#tzcp_customization_stripe_text_color").removeClass("errorField");
    }
    var tzcp_customization_stripe_background_color=$("#tzcp_customization_stripe_background_color").attr("value");
    if(!isBlankOrNull(tzcp_customization_stripe_background_color) && !isValidColor(tzcp_customization_stripe_background_color)){
        $("#tzcp_customization_stripe_background_color").addClass("errorField");
        valid = false;
    }
    else{
        $("#tzcp_customization_stripe_background_color").removeClass("errorField");
    }
    var tzcp_customization_footer_text_color=$("#tzcp_customization_footer_text_color").attr("value");
    if(!isBlankOrNull(tzcp_customization_footer_text_color) && !isValidColor(tzcp_customization_footer_text_color)){
        $("#tzcp_customization_footer_text_color").addClass("errorField");
        valid = false;
    }
    else{
        $("#tzcp_customization_footer_text_color").removeClass("errorField");
    }
    var tzcp_customization_footer_background_color=$("#tzcp_customization_footer_background_color").attr("value");
    if(!isBlankOrNull(tzcp_customization_footer_background_color) && !isValidColor(tzcp_customization_footer_background_color)){
        $("#tzcp_customization_footer_background_color").addClass("errorField");
        valid = false;
    }
    else{
        $("#tzcp_customization_footer_background_color").removeClass("errorField");
    }    
    /**
     * Do validation only if whitelabeled
     */
    var tzcp_customization_footer_logo_urlObj=$("#tzcp_customization_footer_logo_url");
    if(tzcp_customization_footer_logo_urlObj!=null && tzcp_customization_footer_logo_urlObj.length>0){
        var tzcp_customization_footer_logo_url=tzcp_customization_footer_logo_urlObj.attr("value");    
        if(!isBlankOrNull(tzcp_customization_footer_logo_url) && !isValidUrl(tzcp_customization_footer_logo_url)){
            $("#tzcp_customization_footer_logo_url").addClass("errorField");
            valid = false;
        }
        else{
            $("#tzcp_customization_footer_logo_url").removeClass("errorField");
        }
    }
    var tzcp_customization_footer_logo_linkObj=$("#tzcp_customization_footer_logo_link");
    if(tzcp_customization_footer_logo_linkObj!=null && tzcp_customization_footer_logo_linkObj.length>0){
        var tzcp_customization_footer_logo_link=tzcp_customization_footer_logo_linkObj.attr("value");    
        if(!isBlankOrNull(tzcp_customization_footer_logo_link) && !isValidUrl(tzcp_customization_footer_logo_link)){
            $("#tzcp_customization_footer_logo_link").addClass("errorField");
            valid = false;
        }
        else{
            $("#tzcp_customization_footer_logo_link").removeClass("errorField");
        }
    }
    /**
     * Social buttons
     */
    var tzcp_customization_facebook_button_url=$("#tzcp_customization_facebook_button_url").attr("value");    
    if(!isBlankOrNull(tzcp_customization_facebook_button_url) && !isValidUrl(tzcp_customization_facebook_button_url)){
        $("#tzcp_customization_facebook_button_url").addClass("errorField");
        valid = false;
    }
    else{
        $("#tzcp_customization_facebook_button_url").removeClass("errorField");
    }
    var tzcp_customization_google_button_url=$("#tzcp_customization_google_button_url").attr("value");    
    if(!isBlankOrNull(tzcp_customization_google_button_url) && !isValidUrl(tzcp_customization_google_button_url)){
        $("#tzcp_customization_google_button_url").addClass("errorField");
        valid = false;
    }
    else{
        $("#tzcp_customization_google_button_url").removeClass("errorField");
    }
    var tzcp_customization_linkedin_button_url=$("#tzcp_customization_linkedin_button_url").attr("value");    
    if(!isBlankOrNull(tzcp_customization_linkedin_button_url) && !isValidUrl(tzcp_customization_linkedin_button_url)){
        $("#tzcp_customization_linkedin_button_url").addClass("errorField");
        valid = false;
    }
    else{
        $("#tzcp_customization_linkedin_button_url").removeClass("errorField");
    }
    var tzcp_customization_twitter_button_url=$("#tzcp_customization_twitter_button_url").attr("value");    
    if(!isBlankOrNull(tzcp_customization_twitter_button_url) && !isValidUrl(tzcp_customization_twitter_button_url)){
        $("#tzcp_customization_twitter_button_url").addClass("errorField");
        valid = false;
    }
    else{
        $("#tzcp_customization_twitter_button_url").removeClass("errorField");
    }
    var tzcp_customization_instagram_button_url=$("#tzcp_customization_instagram_button_url").attr("value");    
    if(!isBlankOrNull(tzcp_customization_instagram_button_url) && !isValidUrl(tzcp_customization_instagram_button_url)){
        $("#tzcp_customization_instagram_button_url").addClass("errorField");
        valid = false;
    }
    else{
        $("#tzcp_customization_instagram_button_url").removeClass("errorField");
    } 
    var tzcp_customization_live_button_url=$("#tzcp_customization_live_button_url").attr("value");    
    if(!isBlankOrNull(tzcp_customization_live_button_url) && !isValidUrl(tzcp_customization_live_button_url)){
        $("#tzcp_customization_live_button_url").addClass("errorField");
        valid = false;
    }
    else{
        $("#tzcp_customization_live_button_url").removeClass("errorField");
    } 
    if($("#tzcp_customization_advertisement1").is(":checked")){
        var tzcp_customization_advertisement_url=$("#tzcp_customization_advertisement_url").attr("value");
        if(isBlankOrNull(tzcp_customization_advertisement_url) || !isValidUrl(tzcp_customization_advertisement_url)){
            $("#tzcp_customization_advertisement_url").addClass("errorField");
            valid = false;
        }
        else{
            $("#tzcp_customization_advertisement_url").removeClass("errorField");
        }
        var tzcp_customization_advertisement_seconds=$("#tzcp_customization_advertisement_seconds").attr("value");
        if(isBlankOrNull(tzcp_customization_advertisement_seconds)){
            $("#tzcp_customization_advertisement_seconds").addClass("errorField");
            valid = false;
        }
        else{
            $("#tzcp_customization_advertisement_seconds").removeClass("errorField");
        }
    } 
    if($("#tzcp_customization_advertisement2").is(":checked")){
        var tzcp_customization_advertisement_video_url=$("#tzcp_customization_advertisement_video_url").attr("value");
        if(isBlankOrNull(tzcp_customization_advertisement_video_url) || !isValidUrl(tzcp_customization_advertisement_video_url)){
            $("#tzcp_customization_advertisement_video_url").addClass("errorField");
            valid = false;
        }
        else{
            $("#tzcp_customization_advertisement_video_url").removeClass("errorField");
        }
        var tzcp_customization_advertisement_video_seconds=$("#tzcp_customization_advertisement_video_seconds").attr("value");
        if(isBlankOrNull(tzcp_customization_advertisement_video_seconds)){
            $("#tzcp_customization_advertisement_video_seconds").addClass("errorField");
            valid = false;
        }
        else{
            $("#tzcp_customization_advertisement_video_seconds").removeClass("errorField");
        }
    } 
    if($("#tzcp_customization_connect_cust2").is(":checked")){
        
        /**
        * Pass through button customizations
        */
       var array=new Array("eng","ita","esp","por","nor");
       for(k=0;k<array.length;k++){
            var tzcp_customization_coonect_url=$("#tzcp_customization_connect_url_"+array[k]).attr("value");
            if(!isBlankOrNull(tzcp_customization_coonect_url) && !isValidUrl(tzcp_customization_coonect_url)){
                $("#tzcp_customization_connect_url_"+array[k]).addClass("errorField");
                valid = false;
            }
            else{
                $("#tzcp_customization_connect_url_"+array[k]).removeClass("errorField");
            }
       }
    } 
    /** 
     * Client Redirect Radio
     */
    if($("#tzcp_customization_connectsimple_code").is(":checked")){
        var codeTxt=$("#tzcp_customization_connectsimple_code_text").attr("value");
        if(isBlankOrNull(codeTxt)){
            $("#tzcp_customization_connectsimple_code_text").addClass("errorField");
            valid = false;
        }
        else{
            $("#tzcp_customization_connectsimple_code_text").removeClass("errorField");
        }
    }
    else{
        $("#tzcp_customization_connectsimple_code_text").removeClass("errorField");
    }
    if($("#tzcp_customization_abuse_control_enabled").is(":checked")){
        $("#tzcp_customization_abuse_control_sessions_dropdown button").removeClass('disabled');
        $("#tzcp_customization_abuse_control_time_dropdown button").removeClass('disabled');
    }else{
        $("#tzcp_customization_abuse_control_sessions_dropdown button").addClass('disabled');
        $("#tzcp_customization_abuse_control_time_dropdown button").addClass('disabled');
    }
    return valid;
}
function fixUrlValue(element){
    $(element).attr('value',trim($(element).attr('value')));
}

var currentFbCheck=0;
var checkFbCounter=0;
var fbData=null;
function getFacebookPageLocationInfo(fbCheck,page,oncomplete,onerror){
    if(fbCheck==currentFbCheck){
        $.ajax({
            url: "https://graph.facebook.com/"+page+"?fields=id,name,location,picture,likes",
            cache : false,
            dataType: "json",
            statusCode: {
                400: function(data ) {
                    fbData=(data.responseJSON);
                    if(fbCheck==currentFbCheck){
                        eval(onerror);
                    }
                },
                404: function(data) {
                    fbData=(data.responseJSON);
                    if(fbCheck==currentFbCheck){
                        eval(onerror);
                    }
                }
            },
            beforeSend: function( xhr ) {
                 if(fbCheck==currentFbCheck){
                    fbData=null;
                }
            }
        })
        .done(function( data ) {
            if(fbCheck==currentFbCheck){
                fbData=null;
                if(data!=null && data.id!=null){
                    fbData=data;
                    eval(oncomplete);
                }
                else{
                    eval(onerror);
                }
            }

        });
    }
}
function previewFacebookCheckIn(){
    if($("#tzcp_customization_facebook_socialaction_checkin_page_url").val().length<3){
       $("#fbResponseCheckin").hide(); 
    }else{
        currentFbCheck=++checkFbCounter;
        $("#fbResponseCheckin").show();
        $("#fbResponseCheckin .checkFacebook").show();
        $("#fbResponseCheckin .errorFacebook").hide();
        $("#fbResponseCheckin .completeFacebook").hide();
        setTimeout('getFacebookPageLocationInfo('+currentFbCheck+', $("#tzcp_customization_facebook_socialaction_checkin_page_url").val(),"previewFacebookCheckInResponse()","previewFacebookCheckInResponse()");',1000);
    }
}
function previewFacebookCheckInResponse(){
    if(fbData==null){
        $("#fbResponseCheckin .checkFacebook").hide();
        $("#fbResponseCheckin .errorFacebook").show();
        $("#fbResponseCheckin .completeFacebook").hide();
    }
    else{
        if(fbData.error==null){
            $("#fbResponseCheckin .checkFacebook").hide();
            $("#fbResponseCheckin .errorFacebook").hide();
            var resp='<div class="whited"><div class="notification"><table style="width:100%"><tr>';
            if(fbData.id!=null && fbData.name!=null){
                if(fbData.picture!=null && fbData.picture.data!=null && fbData.picture.data.url!=null){
                    resp+="<td style=\"width:100px\"><img width=\"90px\" src=\""+fbData.picture.data.url+"\"/></td>";
                }
                resp+='<td>Page Id:'+fbData.id+"<br/>Name:"+fbData.name;
                if(fbData.location!=null && fbData.location.latitude!=null && fbData.location.longitude!=null){
                    resp+="<br/>Location:"+fbData.location.latitude+","+fbData.location.longitude;
                    resp+="</td>";
                    resp+="<td><img src=\"static/images/yes.png\" width=\"32px\"/>";
                    resp+="</td>";
                }else{
                    resp+="<br/><span style=\"color:darkred\">Location missing, invalid facebook page for check-in</span>";                
                    resp+="<td><img src=\"static/images/_alert.png\" width=\"32px\"/>";
                    resp+="</td>";
                }                

            }
        }
        else{
            if(fbData.error.code=="803"){ //does not exist
                $("#fbResponseCheckin .checkFacebook").hide();
                $("#fbResponseCheckin .errorFacebook").hide();
                var resp='<div class="alert"><div class="notification"><table style="width:100%"><tr>';
                resp+="<td><span style=\"color:darkred\">The supplied Facebook Page does not exist, or is not public</span></td>";
                resp+='</tr></table></div></div>';
                $("#fbResponseCheckin .completeFacebook").html(resp);
                $("#fbResponseCheckin .completeFacebook").show();
            }
            if(fbData.error.code=="104"){ //not public profile
                $("#fbResponseCheckin .checkFacebook").hide();
                $("#fbResponseCheckin .errorFacebook").hide();
                var resp='<div class="alert"><div class="notification"><table style="width:100%"><tr>';
                resp+="<td><span style=\"color:darkred\">The supplied Facebook Page is not a public page for check-in purpose</span></td>";
                resp+='</tr></table></div></div>';
                $("#fbResponseCheckin .completeFacebook").html(resp);
                $("#fbResponseCheckin .completeFacebook").show();
            }
            if(fbData.error.code=="100"){ //not public profile
                $("#fbResponseCheckin .checkFacebook").hide();
                $("#fbResponseCheckin .errorFacebook").hide();
                var resp='<div class="alert"><div class="notification"><table style="width:100%"><tr>';
                resp+="<td><span style=\"color:darkred\">The supplied Facebook Page is not a public page for check-in purpose, it may have restrictions on visibility</span></td>";
                
                resp+='</tr></table></div></div>';
                $("#fbResponseCheckin .completeFacebook").html(resp);
                $("#fbResponseCheckin .completeFacebook").show();
            }
        }
        resp+='</tr></table></div></div>';
        $("#fbResponseCheckin .completeFacebook").html(resp);
        $("#fbResponseCheckin .completeFacebook").show();
    }
}

function previewFacebookLike(){
    if($("#tzcp_customization_facebook_socialaction_page_url").val().length<3){
       $("#fbResponseLike").hide(); 
    }else{
        currentFbCheck=++checkFbCounter;
        $("#fbResponseLike").show();
        $("#fbResponseLike .checkFacebook").show();
        $("#fbResponseLike .errorFacebook").hide();
        $("#fbResponseLike .completeFacebook").hide();
        setTimeout('getFacebookPageLocationInfo('+currentFbCheck+', $("#tzcp_customization_facebook_socialaction_page_url").val(),"previewFacebookLikeResponse()","previewFacebookLikeResponse()");',1000);
    }
}
function previewFacebookLikeResponse(){
    console.log(fbData);
    if(fbData==null){
        $("#fbResponseLike .checkFacebook").hide();
        $("#fbResponseLike .errorFacebook").show();
        $("#fbResponseLike .completeFacebook").hide();
    }
    else{
        if(fbData.error==null){
            $("#fbResponseLike .checkFacebook").hide();
            $("#fbResponseLike .errorFacebook").hide();
            var resp='<div class="whited"><div class="notification"><table style="width:100%"><tr>';
            if(fbData.id!=null && fbData.name!=null){
                if(fbData.picture!=null && fbData.picture.data!=null && fbData.picture.data.url!=null){
                    resp+="<td style=\"width:100px\"><img width=\"90px\" src=\""+fbData.picture.data.url+"\"/></td>";
                }
                resp+='<td>Page Id:'+fbData.id+"<br/>Name:"+fbData.name;
                if(fbData.likes!=null ){
                    resp+="<br/>Likes count:"+fbData.likes;
                    resp+="</td>";
                    resp+="<td><img src=\"static/images/yes.png\" width=\"32px\"/>";
                    resp+="</td>";
                }else{
                    resp+="<br/><span style=\"color:darkred\">No likes count, please check that the page is public and valid</span>";                
                    resp+="<td><img src=\"static/images/_alert.png\" width=\"32px\"/>";
                    resp+="</td>";
                }                

            }
            else{
                resp+="<td><span style=\"color:darkred\">Id or name missing, invalid facebook page</span></td>";
            }
            resp+='</tr></table></div></div>';
            $("#fbResponseLike .completeFacebook").html(resp);
            $("#fbResponseLike .completeFacebook").show();
        }
        else{
            if(fbData.error.code=="803"){ //does not exist
                $("#fbResponseLike .checkFacebook").hide();
                $("#fbResponseLike .errorFacebook").hide();
                var resp='<div class="alert"><div class="notification"><table style="width:100%"><tr>';
                resp+="<td><span style=\"color:darkred\">The supplied Facebook Page does not exist, or is not public</span></td>";
                resp+='</tr></table></div></div>';
                $("#fbResponseLike .completeFacebook").html(resp);
                $("#fbResponseLike .completeFacebook").show();
            }
            if(fbData.error.code=="104"){ //not public profile
                $("#fbResponseLike .checkFacebook").hide();
                $("#fbResponseLike .errorFacebook").hide();
                var resp='<div class="alert"><div class="notification"><table style="width:100%"><tr>';
                resp+="<td><span style=\"color:darkred\">The supplied Facebook Page is not a public page that user can like</span></td>";
                resp+='</tr></table></div></div>';
                $("#fbResponseLike .completeFacebook").html(resp);
                $("#fbResponseLike .completeFacebook").show();
            }
            if(fbData.error.code=="100"){ //not public profile
                $("#fbResponseLike .checkFacebook").hide();
                $("#fbResponseLike .errorFacebook").hide();
                var resp='<div class="alert"><div class="notification"><table style="width:100%"><tr>';
                resp+="<td><span style=\"color:darkred\">The supplied Facebook Page is not a public page that user can like, it may have restrictions on visibility</span></td>";
                resp+='</tr></table></div></div>';
                $("#fbResponseLike .completeFacebook").html(resp);
                $("#fbResponseLike .completeFacebook").show();
            }
        }
    }
}
function getBandwitdhValue(value){
    switch(value+""){
case "0": return "50 kbps";
case "1": return "75 kbps";
case "2": return "100 kbps";
case "3": return "125 kbps";
case "4": return "150 kbps";
case "5": return "175 kbps";
case "6": return "200 kbps";
case "7": return "225 kbps";
case "8": return "250 kbps";
case "9": return "275 kbps";
case "10": return "300 kbps";
case "11": return "325 kbps";
case "12": return "350 kbps";
case "13": return "375 kbps";
case "14": return "400 kbps";
case "15": return "425 kbps";
case "16": return "450 kbps";
case "17": return "475 kbps";
case "18": return "500 kbps";
case "19": return "525 kbps";
case "20": return "550 kbps";
case "21": return "575 kbps";
case "22": return "600 kbps";
case "23": return "625 kbps";
case "24": return "650 kbps";
case "25": return "675 kbps";
case "26": return "700 kbps";
case "27": return "725 kbps";
case "28": return "750 kbps";
case "29": return "775 kbps";
case "30": return "800 kbps";
case "31": return "825 kbps";
case "32": return "850 kbps";
case "33": return "875 kbps";
case "34": return "900 kbps";
case "35": return "925 kbps";
case "36": return "950 kbps";
case "37": return "975 kbps";
case "38": return "1 Mbps";
case "39": return "1.025 Mbps";
case "40": return "1.05 Mbps";
case "41": return "1.075 Mbps";
case "42": return "1.1 Mbps";
case "43": return "1.125 Mbps";
case "44": return "1.15 Mbps";
case "45": return "1.175 Mbps";
case "46": return "1.2 Mbps";
case "47": return "1.225 Mbps";
case "48": return "1.25 Mbps";
case "49": return "1.275 Mbps";
case "50": return "1.3 Mbps";
case "51": return "1.325 Mbps";
case "52": return "1.35 Mbps";
case "53": return "1.375 Mbps";
case "54": return "1.4 Mbps";
case "55": return "1.425 Mbps";
case "56": return "1.45 Mbps";
case "57": return "1.475 Mbps";
case "58": return "1.5 Mbps";
case "59": return "1.525 Mbps";
case "60": return "1.55 Mbps";
case "61": return "1.575 Mbps";
case "62": return "1.6 Mbps";
case "63": return "1.625 Mbps";
case "64": return "1.65 Mbps";
case "65": return "1.675 Mbps";
case "66": return "1.7 Mbps";
case "67": return "1.725 Mbps";
case "68": return "1.75 Mbps";
case "69": return "1.775 Mbps";
case "70": return "1.8 Mbps";
case "71": return "1.825 Mbps";
case "72": return "1.85 Mbps";
case "73": return "1.875 Mbps";
case "74": return "1.9 Mbps";
case "75": return "1.925 Mbps";
case "76": return "1.95 Mbps";
case "77": return "1.975 Mbps";
case "78": return "2 Mbps";
case "79": return "2.1 Mbps";
case "80": return "2.2 Mbps";
case "81": return "2.3 Mbps";
case "82": return "2.4 Mbps";
case "83": return "2.5 Mbps";
case "84": return "2.6 Mbps";
case "85": return "2.7 Mbps";
case "86": return "2.8 Mbps";
case "87": return "2.9 Mbps";
case "88": return "3 Mbps";
case "89": return "3.1 Mbps";
case "90": return "3.2 Mbps";
case "91": return "3.3 Mbps";
case "92": return "3.4 Mbps";
case "93": return "3.5 Mbps";
case "94": return "3.6 Mbps";
case "95": return "3.7 Mbps";
case "96": return "3.8 Mbps";
case "97": return "3.9 Mbps";
case "98": return "4 Mbps";
case "99": return "4.1 Mbps";
case "100": return "4.2 Mbps";
case "101": return "4.3 Mbps";
case "102": return "4.4 Mbps";
case "103": return "4.5 Mbps";
case "104": return "4.6 Mbps";
case "105": return "4.7 Mbps";
case "106": return "4.8 Mbps";
case "107": return "4.9 Mbps";
case "108": return "5 Mbps";
case "109": return "5.1 Mbps";
case "110": return "5.2 Mbps";
case "111": return "5.3 Mbps";
case "112": return "5.4 Mbps";
case "113": return "5.5 Mbps";
case "114": return "5.6 Mbps";
case "115": return "5.7 Mbps";
case "116": return "5.8 Mbps";
case "117": return "5.9 Mbps";
case "118": return "6 Mbps";
case "119": return "6.1 Mbps";
case "120": return "6.2 Mbps";
case "121": return "6.3 Mbps";
case "122": return "6.4 Mbps";
case "123": return "6.5 Mbps";
case "124": return "6.6 Mbps";
case "125": return "6.7 Mbps";
case "126": return "6.8 Mbps";
case "127": return "6.9 Mbps";
case "128": return "7 Mbps";
case "129": return "7.1 Mbps";
case "130": return "7.2 Mbps";
case "131": return "7.3 Mbps";
case "132": return "7.4 Mbps";
case "133": return "7.5 Mbps";
case "134": return "7.6 Mbps";
case "135": return "7.7 Mbps";
case "136": return "7.8 Mbps";
case "137": return "7.9 Mbps";
case "138": return "8 Mbps";
case "139": return "8.1 Mbps";
case "140": return "8.2 Mbps";
case "141": return "8.3 Mbps";
case "142": return "8.4 Mbps";
case "143": return "8.5 Mbps";
case "144": return "8.6 Mbps";
case "145": return "8.7 Mbps";
case "146": return "8.8 Mbps";
case "147": return "8.9 Mbps";
case "148": return "9 Mbps";
case "149": return "9.1 Mbps";
case "150": return "9.2 Mbps";
case "151": return "9.3 Mbps";
case "152": return "9.4 Mbps";
case "153": return "9.5 Mbps";
case "154": return "9.6 Mbps";
case "155": return "9.7 Mbps";
case "156": return "9.8 Mbps";
case "157": return "9.9 Mbps";
case "158": return "10 Mbps";
case "159": return "11 Mbps";
case "160": return "12 Mbps";
case "161": return "13 Mbps";
case "162": return "14 Mbps";
case "163": return "15 Mbps";
case "164": return "16 Mbps";
case "165": return "17 Mbps";
case "166": return "18 Mbps";
case "167": return "19 Mbps";
case "168": return "20 Mbps";
case "169": return "30 Mbps";
case "170": return "40 Mbps";
case "171": return "50 Mbps";
case "172": return "60 Mbps";
case "173": return "70 Mbps";
case "174": return "80 Mbps";
case "175": return "90 Mbps";
case "176": return "100 Mbps";
case "177": return "Unlimited";

    }
}