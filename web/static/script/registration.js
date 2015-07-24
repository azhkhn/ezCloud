function tzReadCookie(c_name){
    if (document.cookie.length>0){
        c_start=document.cookie.indexOf(c_name + "=");
        if (c_start!=-1){ 
            c_start=c_start + c_name.length+1;
            c_end=document.cookie.indexOf(";",c_start);
            if (c_end==-1){
                c_end=document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start,c_end));
        } 
    }
    return "";
}
function setHSRegistrationCookie(){
    $('#hubspotutk').attr("value",tzReadCookie("hubspotutk"));
    $('#hubspotvw').attr("value",tzReadCookie("hubspotvw"));
    $('#hubspotvm').attr("value",tzReadCookie("hubspotvm"));
    $('#hubspotvd').attr("value",tzReadCookie("hubspotvd"));
    $('#hubspotdt').attr("value",tzReadCookie("hubspotdt"));
}
function updateHSCookie(){
    document.cookie="hubspotutk="+escape(hubspotutk)+";domain="+(environment=="localhost")?"localhost":".tanaza.com";
    document.cookie="hubspotvw="+escape(hubspotvw)+";domain="+(environment=="localhost")?"localhost":".tanaza.com";
    document.cookie="hubspotvm="+escape(hubspotvm)+";domain="+(environment=="localhost")?"localhost":".tanaza.com";
    document.cookie="hubspotvd="+escape(hubspotvd)+";domain="+(environment=="localhost")?"localhost":".tanaza.com";
    document.cookie="hubspotdt="+escape(hubspotdt)+";domain="+(environment=="localhost")?"localhost":".tanaza.com";
}
function submitRegistration(){
    var params=$("#regForm").serialize();
    sendAjax("index.php","action=registrationSubmit&"+params,function(data) {
        $("#regcontent").html(data.content);	
        if (data.postJavascript != null) {
            eval(data.postJavascript);
        }
    });
}
function sendAjax(url,data,success,beforeSend){
    $.ajax({
        type: "GET",
        cache: false,
        async: true,
        url: getServer()+url,
        data: data,
        crossDomain: true,
        dataType: "jsonp",
        success: success,
        beforeSend: beforeSend
    });
    $(".loadingConfigurationDiv").show();
        
}
//should go on tanaza.com
function loadRegistrationForm(){
    sendAjax("index.php","action=registration",function(data) {
        $("#regcontent").html(data.content);	
        if (data.postJavascript != null) {
            eval(data.postJavascript);
        }
        $('#title-container h1.title').html("Tanaza Registration");
        $('title').html('Tanaza - Tanaza Registration'); 
    });    
}
function loadResetPasswordForm(){
    sendAjax("index.php","action=resetPassword",function(data) {
        $("#regcontent").html(data.content);	
        if (data.postJavascript != null) {
            eval(data.postJavascript);
        }
        $('#title-container h1.title').html("Tanaza Reset Password Form");
        $('title').html('Tanaza - Tanaza Reset Password Form');
    });
    
}
function loadLoginForm(){
    window.location.href="/?logout=true";
}
function loadActivationForm(email,activation){
    sendAjax("index.php","action=registrationActivation&email="+encodeURI(email)+"&a="+encodeURI(activation),function(data) {
        $("#regcontent").html(data.content);	
        if (data.postJavascript != null) {
            eval(data.postJavascript);
        }
    });
}
function submitResetPassword(){
    var params=$("#regForm").serialize();
    sendAjax("index.php","action=resetPasswordSubmit&"+params,function(data) {
        $("#regcontent").html(data.content);	
        if (data.postJavascript != null) {
            eval(data.postJavascript);
        }
    });
}
function loadResetPasswordChoiceForm(email,ticket){
    sendAjax("index.php","action=resetPasswordChoice&email="+encodeURI(email)+"&t="+encodeURI(ticket),function(data) {
        $("#regcontent").html(data.content);	
        if (data.postJavascript != null) {
            eval(data.postJavascript);
        }
    });
}
function submitResetPasswordChoiceSubmit(){
    var params=$("#regForm").serialize();
    sendAjax("index.php","action=resetPasswordChoiceSubmit&"+params,function(data) {
        $("#regcontent").html(data.content);	
        if (data.postJavascript != null) {
            eval(data.postJavascript);
        }
    });
}
function submitLoginForm(){
    var params=$("#regForm").serialize();
    sendAjax("index.php","action=loginSubmit&"+params,function(data) {
        $("#regcontent").html(data.content);	
        if (data.postJavascript != null) {
            eval(data.postJavascript);
        }
    }); 
}
function provideSubmit(event,id){
    if(event.keyCode == 13){
        $("#"+id).click();
        event.preventDefault();
    }
    
}
function avoidSubmit(event){
    if(event.keyCode == 13){
        event.preventDefault();
    }
}