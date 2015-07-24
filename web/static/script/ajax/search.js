var searchid=0;
var popoverInitialized=false;
function showSearch(){
    searchid++;
    if(!popoverInitialized){
        $("#searchField").popover({
            content:"Loading",
            title:"Results<img src='static/images/loader-micro.gif' style='display:none;vertical-align:middle' width='15'/>",
            placement:"auto",
            html:true,
            trigger:'manual'
        });       
    }
    if($("#searchField").attr("value").length>2){
        if($("#searchField").parent().find(".popover").length>0 && $("#searchField").parent().find(".popover").is(":visible")){
                
        }
        else{
            //$("#searchField").popover('destroy');
            $("#searchField").popover({
                content:"",
                title:"Results",
                placement:"auto",
                html:true,
                trigger:'manual'
            });                
            $("#searchField").popover('show');
        }  
        $("#searchField").parent().find(".popover-title img").show();
        executeAjaxRequest("index.php?", "action=ajaxSearch&sid="+searchid+"&key="+encodeURI($("#searchField").attr("value")),
            // success
            function(data) {
                if (stopExecutionNoHistory(data)) {
                    return;
                }
                if (data.sid!=searchid) {
                    return;
                }
                $("#searchField").parent().find(".popover-content").html(data.content);
                if (data.postJavascript != null) {
                    eval(data.postJavascript);
                }
                $("#searchField").parent().find(".popover-title img").hide();
            },
            // beforeSend
            function(xhr) {
            });
    }else{
        if($("#searchField").attr("value").length>0){
            //$("#searchField").popover('destroy');              
            if( !($("#searchField").parent().find(".popover").length>0 && $("#searchField").parent().find(".popover").is(":visible")) ){
                $("#searchField").popover('show');
            }
            $("#searchField").parent().find(".popover-content").html("<span class='text-danger' style='font-size:13px'>The search key must be long at least 3 characters</span>");
        // $("#searchField").parent().find(".popover-title").append("<img src='static/images/loader-micro.gif' style='display:none;vertical-align:middle' width='15'/>");
        }else{
            $("#searchField").popover('hide');
        }
    }
}
function resetSearch(){
    $("#searchField").attr("value","");
    showSearch();
}
function hideSearch(){
    $("#searchField").popover('destroy');
}