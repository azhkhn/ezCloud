function accountAddCode(){
    loadPage('userAccount_credits','code='+$("#couponCode").attr("value"),'withMenu');
}
function accountCloseUpgradeToPro(){
    $('#upgradeToPro').overlay().close();
}
function accountUpgradeToPro(){
    $('#accept_upgrade_to_pro_button_en').hide();
    $('#accept_upgrade_to_pro_button_di').show();
    loadPage("userAccount_upgradeToPro","accept=true","exposeFullPage");
}
function accountEmailalertSubmit(){
    if(isBlankOrNull($("#emailalertvalue").attr("value"))){
        $("#emailalertvalue").attr("value",$("#default_emailalertvalue").attr("value"));
    }
    if(!isValidEmail($("#emailalertvalue").attr("value"))){
        alert("Please specify a valid email address");
        return;
    }
    var form2=$("#emailAlertForm").serialize();
    loadPage("userAccount_emailalert_submit",form2,"withMenu");
}

function accountApisStatusSubmit(){
    var form2=$("#apisForm").serialize();
    loadPage("userAccount_apis",form2,"withMenu");
}
function accountApisRegenerateSubmit(){
    if(confirm('Attention: if you generate a new token, all the previous token will be invalidated.')){
        var form2=$("#apisForm").serialize()+"&regenerate=true";
        loadPage("userAccount_apis",form2,"withMenu");
    }
}
function accountLogininfoSubmit(){
    var form2=$("#logininfoForm").serialize();
    loadPage("userAccount_logininfo",form2,"withMenu");
}