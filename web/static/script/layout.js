var display=new Array(true,true,true);
var displayExpose=new Array(true,true,true);
function updateDisplay(){
    if(display[0]==true){
        $("#menuLevel3").show();
    }
    else{
        $("#menuLevel3").hide();
    }
    if(display[2]==true){
        $("#help").show();
    }
    else{
        $("#help").hide();
    }
}
function updateDisplayExpose(){
    if(displayExpose[0]==true){
        $("#exposeLeft").show();
    }
    else{
        $("#exposeLeft").hide();
    }
    if(displayExpose[2]==true){
        $("#exposeRight").show();
    }
    else{
        $("#exposeRight").hide();
    }
}

function loadPage(page, params, standardPage) {
    console.log("Requesting loadPage:"+page);
    resetToolTips();
    //alert("page is "+page+" params is "+params+" standardPage is "+standardPage);
    if(standardPage!=null){
        switch(standardPage){
            case 'graphData':
                requestUri = "action="+page;
                if (params != null) {
                    requestUri += "&" + params;
                }
                executeAjaxRequest("index.php?", requestUri,
                    // success
                    function(data) {
                        if (stopExecution(data)) {
                            return;
                        }	
                        if (data.postJavascript != null) {
                            eval(data.postJavascript);
                        }
                    },
                    // beforeSend
                    function(xhr) {
                    });
                break;
            case 'fullPage':
                requestUri = "action="+page;
                if (params != null) {
                    requestUri += "&" + params;
                }
                updateLayout(1);
                executeAjaxRequest("index.php?", requestUri,
                    // success
                    function(data) {
                        if (stopExecution(data)) {
                            return;
                        }
                        if(data.menu3!=null){
                            showSection("menuLevel3",data.menu3 );
                        }
                        if(data.content){
                            showSection("content", data.content);
                        }
                        if(data.titleText){
                            jQuery("#titleText").html(data.titleText);
                        }			
                        if (data.postJavascript != null) {
                            eval(data.postJavascript);
                        }
                        updateMainSize();
                    },
                    // beforeSend
                    function(xhr) {
                        // xhr.overrideMimeType( 'text/plain; charset=x-user-defined' );
                        showLoader("content");
                    });
                break;
            case 'withMenu':
                requestUri = "action="+page;
                if (params != null) {
                    requestUri += "&" + params;
                }
                updateLayout(3);
                executeAjaxRequest("index.php?", requestUri,
                    // success
                    function(data) {
                        if (stopExecution(data)) {
                            return;
                        }
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
                    });
                break;
            case 'exposeWithMenu':
                requestUri = "action="+page;
                if (params != null) {
                    requestUri += "&" + params;
                }
                executeAjaxRequest("index.php?", requestUri,
                    // success
                    function(data) {
                        if (stopExecution(data)) {
                            return;
                        }
                        if(data.left!=null){
                            showSection("exposeLeft",data.left,true);
                        }
                        if(data.center!=null){
                            showSection("exposeCenter", data.center, true);
                        }
                        if(data.right!=null){       
                            showSection("exposeRight", data.right, true);
                        }
                        if (data.postJavascript != null) {
                            eval(data.postJavascript);
                        }
                    },
                    // beforeSend
                    function(xhr) {
                        //showLoader("exposeLeft",true);
                        showLoader("exposeCenter",true);
                        showLoader("exposeRight",true);
                    });
                break;
            case "exposeFullPage":
                requestUri = "action="+page;
                if (params != null) {
                    requestUri += "&" + params;
                }
                updateExposeLayout(1);
                executeAjaxRequest("index.php?", requestUri,
                    // success
                    function(data) {
                        if (stopExecution(data)) {
                            return;
                        }
                        if(data.left!=null){
                            showSection("exposeLeft",data.left,true);
                        }
                        if(data.center!=null){
                            showSection("exposeCenter", data.center, true);
                        }
                        if(data.right!=null){       
                            showSection("exposeRight", data.right, true);
                        }
                        if (data.postJavascript != null) {
                            eval(data.postJavascript);
                        }
                        updateExposeSize();
                    },
                    // beforeSend
                    function(xhr) {
                        showLoader("exposeCenter", true);
                    });
                break;
            case "noUI": // to use to send data to server without user interaction
                requestUri = "action="+page;
                if (params != null) {
                    requestUri += "&" + params;
                }
                //updateExposeLayout(1);
                executeAjaxRequest("index.php?", requestUri,
                    // success
                    function(data) {
                        if (stopExecution(data)) {
                            return;
                        }
                    },
                    // beforeSend
                    function(xhr) {
                    //showLoader("exposeCenter", true);
                    });
                break;
        }
        return;
    }
    var requestUri = null;
    switch (page) {
        // StartPages checks the user account and redirect the user who is accessing
        // the start page to the right section
        case "startPage":
            updateLayout(3);
            executeAjaxRequest("index.php?", "action=ajaxLoadStartPage",
                // success
                function(data) {
                    if (stopExecution(data)) {
                        return;
                    }
                    if(data.menu3!=null){
                        showSection("menuLevel3",data.menu3 );
                    }
                    if(data.content){
                        showSection("content", data.content);
                    }
                    if(data.titleText){
                        jQuery("#titleText").html(data.titleText);
                    }			
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
                });
            break;
        // Dashboard
        case "0-0":
            break;
        // Monitor - Overview
        case "1-0":
            break;
        // Monitor - Network statistics
        case "1-1":
            requestUri = "action=ajaxLoadMonitorNetworkStatistics";
            if (params != null) {
                requestUri += "&" + params;
            }
            updateLayout(3);
            executeAjaxRequest("index.php?", requestUri,
                // success
                function(data) {
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
                    showSecondaryMenu("1","1",false);
                },
                // beforeSend
                function(xhr) {
                    // xhr.overrideMimeType( 'text/plain; charset=x-user-defined' );
                    showLoader("menuLevel3");
                    showLoader("content");
                });
            break;
        // Monitor - Access Point statistics
        case "1-2":
            requestUri = "action=ajaxLoadMonitorAPStatistics";
            if (params != null) {
                requestUri += "&" + params;
            }
            updateLayout(3);
            executeAjaxRequest("index.php?", requestUri,
                // success
                function(data) {
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
                    showSecondaryMenu("1","2",false);
                },
                // beforeSend
                function(xhr) {
                    // xhr.overrideMimeType( 'text/plain; charset=x-user-defined' );
                    showLoader("menuLevel3");
                    showLoader("content");
                });
            break;
        case "1-3":
            requestUri = "action=ajaxLoadMonitorClientStatistics";
            if (params != null) {
                requestUri += "&" + params;
            }
            updateLayout(3);
            executeAjaxRequest("index.php?", requestUri,
                // success
                function(data) {
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
                    showSecondaryMenu("1","3",false);
                },
                // beforeSend
                function(xhr) {
                    // xhr.overrideMimeType( 'text/plain; charset=x-user-defined' );
                    showLoader("menuLevel3");
                    showLoader("content");
                });
            break;
        case "2-0":
            /*requestUri = "action=ajaxLoadConfigureOverview";
            if (params != null) {
                requestUri += "&" + params;
            }
            updateLayout(3);
            executeAjaxRequest("index.php?", requestUri,
                // success
                function(data) {
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
                },
                // beforeSend
                function(xhr) {
                    showLoader("menuLevel3");
                    showLoader("content");
                });
            break;*/
        case "2-2":
            page="2-2";
            requestUri = "action=ajaxLoadConfigure_accessPoint_list";
            if (params != null) {
                requestUri += "&" + params;
            }
            updateLayout(1);
            executeAjaxRequest("index.php?", requestUri,
                // success
                function(data) {
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
                },
                // beforeSend
                function(xhr) {
                    showLoader("menuLevel3");
                    showLoader("content");
                });
            break;
        case "2-3":
            requestUri = "action=ajaxLoadConfigureSsid_ssid_list";
            if (params != null) {
                requestUri += "&" + params;
            }
            updateLayout(1);
            executeAjaxRequest("index.php?", requestUri,
                // success
                function(data) {
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
                },
                // beforeSend
                function(xhr) {
                    showLoader("menuLevel3");
                    showLoader("content");
                });
            break;
        case "3-0":
            requestUri = "action=ajaxLoadManageNetworksOverview";
            if (params != null) {
                requestUri += "&" + params;
            }
            updateLayout(1);
            executeAjaxRequest("index.php?", requestUri,
                // success
                function(data) {
                    if (stopExecution(data)) {
                        return;
                    }
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
                    showLoader("content");
                });
            break;
        case "3-2":
            updateLayout(1);
            executeAjaxRequest("index.php?", "action=ajaxLoadManageNetworksManage",
                // success
                function(data) {
                    if (stopExecution(data)) {
                        return;
                    }
                    showSection("menuLevel3", data.menu3);
                    showSection("content", data.content);
                    if (data.postJavascript != null) {
                        eval(data.postJavascript);
                    }
                    updateMainSize();
                },
                // beforeSend
                function(xhr) {
                    // xhr.overrideMimeType( 'text/plain; charset=x-user-defined' );
                    showLoader("content");
                });
            break;
        case "3-3":
            updateLayout(1);
            executeAjaxRequest("index.php?","action=ajaxLoadManageNetworks_InstallAgent",
                // success
                function(data) {
                    if (stopExecution(data)) {
                        return;
                    }
                    showSection("content", data.content);
                    if (data.postJavascript != null) {
                        eval(data.postJavascript);
                    }
                    updateMainSize();
                },
                // beforeSend
                function(xhr) {
                    // xhr.overrideMimeType( 'text/plain;
                    // charset=x-user-defined' );
                    showLoader("content");
                });
            break;
        case "configure-accessPoint-settings":
            requestUri = "action=ajaxLoadConfigure_accessPoint_settings";
            if (params != null) {
                requestUri += "&" + params;
            }
            updateLayout(3);
            executeAjaxRequest("index.php?", requestUri,
                // success
                function(data) {
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
                    showSecondaryMenu(2,2,false);
                },
                // beforeSend
                function(xhr) {
                    showLoader("menuLevel3");
                    showLoader("content");
                });
            break;
        case "configure-ssid-settings":
            requestUri = "action=ajaxLoadConfigureSsid_ssid_settings";
            if (params != null) {
                requestUri += "&" + params;
            }
            updateLayout(3);
            executeAjaxRequest("index.php?", requestUri,
                // success
                function(data) {
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
                },
                // beforeSend
                function(xhr) {
                    showLoader("menuLevel3");
                    showLoader("content");
                });
            break;
        case "manage-agents-settings":
            requestUri = "action=ajaxLoadManageNetworksManage_configureConnector";
            if (params != null) {
                requestUri += "&" + params;
            }
            updateLayout(3);
            executeAjaxRequest("index.php?", requestUri,
                // success
                function(data) {
                    if (stopExecution(data)) {
                        return;
                    }
                    jQuery("#contentInner").html("");
                    showSection("menuLevel3", data.menu3);
                    showSection("content", data.content);
                    jQuery("#titleText").html("");
                    if (data.postJavascript != null) {
                        eval(data.postJavascript);
                    }
                    updateMainSize();
                    showSecondaryMenu(3,2,false);
                },
                // beforeSend
                function(xhr) {
                    showLoader("menuLevel3");
                    showLoader("content");
                });
            break;        
        case "2-4":
            updateLayout(1);
            requestUri = "action=ajaxMultipleAdd";
            if (params != null) {
                requestUri += "&" + params;
            }
            executeAjaxRequest("index.php?",requestUri,
                // success
                function(data) {
                    if (stopExecution(data)) {
                        return;
                    }
                    showSection("content", data.content);
                    jQuery("#titleText").html(data.titleText);
                    if (data.postJavascript != null) {
                        eval(data.postJavascript);
                    }
                    updateMainSize();
                },
                // beforeSend
                function(xhr) {
                    // xhr.overrideMimeType( 'text/plain;
                    // charset=x-user-defined' );
                    showLoader("content");
                });
            break;
    }
}

function updateExposeSize(minheight, height) {
    var h = $("#exposeCenter").height();
    if (h == 0) {
        if (height != null) {
            h = height;
        } else {
            h = 100;
        }
    }
    if (minheight != null) {
        if (h < minheight) {
            h = minheight;
        }
    }
    $('#exposeContainer').css('height',h + 10);
}

function showError(identifier,errorText){
    if(is_string(identifier)){
        var element=$(identifier);
        if(element.is('select')){
            element=$(identifier+"-button");
        }
        element.addClass("errorField");
    }
    else{
        if(identifier.is('select')){
            identifier=$(identifier.attr("id")+"-button");
        }
        identifier.addClass("errorField");
    }
}
function cleanField(identifier,errorText){
    if(is_string(identifier)){
        var element=$(identifier);
        if(element.is('select')){
            element=$(identifier+"_dropdown");
        }
        element.removeClass("errorField");
        element.removeClass("modifiedField");
    }
    else{
        if(identifier.is('select')){
            identifier=$(identifier.attr("id")+"_dropdown");
        }
        identifier.removeClass("errorField");
        identifier.removeClass("modifiedField");
    }
}
function showModified(identifier,errorText){
    if(is_string(identifier)){
        var element=$(identifier);
        if(element.is('select')){
            element=$(identifier+"_dropdown");
        }
        element.addClass("modifiedField");
    }
    else{
        if(identifier.is('select')){
            identifier=$(identifier.attr("id")+"_dropdown");
        }
        identifier.addClass("modifiedField");
    }
}
function animateButtons(){
    $( ".thumbnail a" ).mouseover( function() {  
        $( this ).children( "input" ).stop( true, true ).animate({  
            opacity: 0.3  
        }, 300, "swing", function() {  
            $( this ).animate({  
                opacity: 1  
            }, 500 );  
        });  
    });  
    $( ".bttn" ).mouseover( function() {  
        if(!$(this).hasClass("bttnds_red") && !$(this).hasClass("bttnds_black") && !$(this).hasClass("bttnds_gray")) {
            $( this ).stop( true, true ).animate({  
                opacity: 0.3  
            }, 300, "swing", function() {  
                $( this ).animate({  
                    opacity: 1  
                }, 500 );  
            }); 
        }
    });
}
