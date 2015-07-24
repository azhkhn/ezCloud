/**
   Row format:
   SSID1:null/value
   SSID2:null/value
   STATUS:0...3 
	0 = Ok
NOT USED 1 = Sync with AP
	2 = Fix problem import
        3 = Fix problem conflict
        4 = Deleted
        5 = Deleted (Disabled Profile)
        6 = Fix problem import(Disabled Profile)
        7 = Fix problem conflict (Disabled Profile)
    SSID_ON:0..2
	0: null
	1: true
	2: false
    INDEX:value
 */
var maxAis=1;
var minAis=0;
var newssidIndex=0;
var rows_ssid = new Array();
var rows_ssid_start = new Array();
var captivePortalEnabled=false;
function showTooltips(){
    var array=$('.ssidInfoTrigger');
    for(var i=0;i<array.length;i++){
        activateSsidToolTip($(array[i]));
    }
    
}
/**
 * This function initialized the layout of the ssid section, creating html elements based on rows_ssid array
 */
function parseSsidConflicts(){
    newssidIndex=0;
    for(var i=0;i<rows_ssid.length;i++){
        $('#ssid_conflicts_table').append("<tr id=\"ssid_tr_"+i+"\"></tr>");
        $('#ssid_conflicts_table').append("<tr id=\"fix_ssid_tr_"+i+"\" class=\"fix\" style=\"display:none\"></tr>");
    }
    for(i=0;i<rows_ssid.length;i++){
        if(rows_ssid[i]['auth_1']=="Captive Portal"){
            if(!captivePortalEnabled){
                parseSsidConflicts_nocaptiveportalfeature(rows_ssid[i]['identifier'],i, rows_ssid[i]['ssid1'], rows_ssid[i]['ssid_on'],false);
                continue;
            }
           
        }
        switch(rows_ssid[i]['status']){
            case 0:
                parseSsidConflicts_ok(rows_ssid[i]['identifier'],i, rows_ssid[i]['ssid1'], rows_ssid[i]['ssid_on'],false);
                break;

            case 2:
                parseSsidConflicts_fix_import(rows_ssid[i]['identifier'],i, rows_ssid[i]['ssid1'],rows_ssid[i]['ssid_on'],false);
                break;
            case 3:
                parseSsidConflicts_fix_conflict(rows_ssid[i]['identifier'],i, rows_ssid[i]['ssid1'],rows_ssid[i]['ssid_on'],false);
                break;
            case 6:
                parseSsidConflicts_fix_importDisabled(rows_ssid[i]['identifier'],i, rows_ssid[i]['ssid1'],rows_ssid[i]['ssid_on'],false);
                break;
            case 7:
                parseSsidConflicts_fix_conflictDisabled(rows_ssid[i]['identifier'],i, rows_ssid[i]['ssid1'],rows_ssid[i]['ssid_on'],false);
                break;
        }
    }
    bindClickOnSsidCheckbox();
    
    animateButtons();
}
function toggleSsidInfoPwd(div) {
    var type = $("#"+div+"Type").attr("value");
    if(type=="password"){
        $("#"+div+"Text").attr("value",$("#"+div).attr("value"));
        $("#"+div).hide();
        $("#"+div+"Text").show();
        $("#"+div+"Type").attr("value","text");
    }
    else{
        $("#"+div).attr("value",$("#"+div+"Text").attr("value"));
        $("#"+div).show();
        $("#"+div+"Text").hide();
        $("#"+div+"Type").attr("value","password");
    }
}
/**
 * Creates a row for the specified row_index, that represents a syncronized ssid
 * ssid info ok
 */
function parseSsidConflicts_nocaptiveportalfeature(identifier,row_index,ssid1,ssid_on,notify_change){
    var text=$('#ap_nocaptiveportalfeature').attr("value");
    text=text.replace(/__SSID__/g,ssid1);
    
    
    if(ssid_on==1){
        text=text.replace(/__SSID_ENABLE__/g,"selected");
        text=text.replace(/__SSID_DISABLE__/g,"");
    }
    else{
        text=text.replace(/__SSID_ENABLE__/g,"");
        text=text.replace(/__SSID_DISABLE__/g,"selected");
    }
    text=text.replace(/__SSID_VNAME__/g,identifier);
    if(ssid_on==1){
        text=text.replace(/__SSID_CHECKED__/g," checked=\"checked\" ");
    }
    else{
        text=text.replace(/__SSID_CHECKED__/g,"");
    }
    
    /* SSID INFO SECTION*/
    var ssidid=identifier.replace("f_netssid_","").replace("f_apssid_","");
    text=text.replace(/__SSID_ID__/g,ssidid);
    text=text.replace(/__SSID_AUTH__/g,rows_ssid[row_index]["auth_1"]);
    text=text.replace(/__SSID_BROADCAST__/g,rows_ssid[row_index]["broadcast_1"]);
    text=text.replace(/__SSID_ISOLATION__/g,rows_ssid[row_index]["isolation_1"]);
    text=text.replace(/__SSID_PASS__/g,rows_ssid[row_index]["password_1"]);
    if(rows_ssid[row_index]["linkid"]!=""){
        text=text.replace(/__SSID_DISPLAY_A_/g,"");
        text=text.replace(/__SSID_LINKID__/g,rows_ssid[row_index]["linkid"]);
    }
    else{
        text=text.replace(/__SSID_DISPLAY_A_/g,"  style='display:none' ");
    }
    if(rows_ssid[row_index]["auth_1"]=="Open" || rows_ssid[row_index]["auth_1"]=="Captive Portal"){
        text=text.replace(/__SSID_DISPLAY_PASSWORD__/g,"  style='display:none' ");
    }
    else{
        text=text.replace(/__SSID_DISPLAY_PASSWORD__/g,"");
    }
    
    $("#ssid_tr_"+row_index).html(text);
    $("#fix_ssid_tr_"+row_index).html('');
    if(notify_change==null || notify_change==true){
        showModifiedApSsid();
    }
    showTooltips();
}
/**
 * Creates a row for the specified row_index, that represents a syncronized ssid
 * ssid info ok
 */
function parseSsidConflicts_ok(identifier,row_index,ssid1,ssid_on,notify_change){
    var text=$('#ap_ok').attr("value");
    text=text.replace(/__SSID__/g,htmlEntities(ssid1));
    
    
    if(ssid_on==1){
        text=text.replace(/__SSID_ENABLE__/g,"selected");
        text=text.replace(/__SSID_DISABLE__/g,"");
    }
    else{
        text=text.replace(/__SSID_ENABLE__/g,"");
        text=text.replace(/__SSID_DISABLE__/g,"selected");
    }
    text=text.replace(/__SSID_VNAME__/g,identifier);
    if(ssid_on==1){
        text=text.replace(/__SSID_CHECKED__/g," checked=\"checked\" ");
    }
    else{
        text=text.replace(/__SSID_CHECKED__/g,"");
    }
    
    /* SSID INFO SECTION*/
    var ssidid=identifier.replace("f_netssid_","").replace("f_apssid_","");
    text=text.replace(/__SSID_ID__/g,ssidid);
    text=text.replace(/__SSID_AUTH__/g,rows_ssid[row_index]["auth_1"]);
    text=text.replace(/__SSID_BROADCAST__/g,rows_ssid[row_index]["broadcast_1"]);
    text=text.replace(/__SSID_ISOLATION__/g,rows_ssid[row_index]["isolation_1"]);
    text=text.replace(/__SSID_PASS__/g,rows_ssid[row_index]["password_1"]);
    if(rows_ssid[row_index]["linkid"]!=""){
        text=text.replace(/__SSID_DISPLAY_A_/g,"");
        text=text.replace(/__SSID_LINKID__/g,rows_ssid[row_index]["linkid"]);
    }
    else{
        text=text.replace(/__SSID_DISPLAY_A_/g,"  style='display:none' ");
    }
    if(rows_ssid[row_index]["auth_1"]=="Open" || rows_ssid[row_index]["auth_1"]=="Captive Portal"){
        text=text.replace(/__SSID_DISPLAY_PASSWORD__/g,"  style='display:none' ");
    }
    else{
        text=text.replace(/__SSID_DISPLAY_PASSWORD__/g,"");
    }
    
    $("#ssid_tr_"+row_index).html(text);
    $("#fix_ssid_tr_"+row_index).html('');
    if(notify_change==null || notify_change==true){
        showModifiedApSsid();
    }
    showTooltips();
}
/**
 * Creates a row for the specified row_index, that represents a syncronized ssid, after importing a private ssid from swap section
 * ssid info ok
 */
function parseSsidConflicts_ok_import(identifier,row_index,ssid1,ssid_on,notify_change){
    var text=$('#ap_ok_import').attr("value");
    text=text.replace(/__SSID__/g,htmlEntities(ssid1));
    if(ssid_on==1){
        text=text.replace("__SSID_ENABLE__","selected");
        text=text.replace("__SSID_DISABLE__","");
    }
    else{
        text=text.replace("__SSID_ENABLE__","");
        text=text.replace("__SSID_DISABLE__","selected");
    }
    text=text.replace("__SSID_VNAME__",identifier);
    text=text.replace("__SSID_VNAME__",identifier);
    if(ssid_on==1){
        text=text.replace("__SSID_CHECKED__"," checked=\"checked\" ");
    }
    else{
        text=text.replace("__SSID_CHECKED__","");
    }
    
    /* SSID INFO SECTION*/
    var ssidid=identifier.replace("f_netssid_","").replace("f_apssid_","");
    text=text.replace(/__SSID_ID__/g,ssidid);
    text=text.replace(/__SSID_AUTH__/g,rows_ssid[row_index]["auth_1"]);
    text=text.replace(/__SSID_BROADCAST__/g,rows_ssid[row_index]["broadcast_1"]);
    text=text.replace(/__SSID_ISOLATION__/g,rows_ssid[row_index]["isolation_1"]);
    text=text.replace(/__SSID_PASS__/g,rows_ssid[row_index]["password_1"]);
    if(rows_ssid[row_index]["linkid"]!=""){
        text=text.replace(/__SSID_DISPLAY_A_/g,"");
        text=text.replace(/__SSID_LINKID__/g,rows_ssid[row_index]["linkid"]);
    }
    else{
        text=text.replace(/__SSID_DISPLAY_A_/g,"  style='display:none' ");
    }
    if(rows_ssid[row_index]["auth_1"]=="Open" || rows_ssid[row_index]["auth_1"]=="Captive Portal"){
        text=text.replace(/__SSID_DISPLAY_PASSWORD__/g,"  style='display:none' ");
    }
    else{
        text=text.replace(/__SSID_DISPLAY_PASSWORD__/g,"");
    }
    
    $("#ssid_tr_"+row_index).html(text);
    $("#fix_ssid_tr_"+row_index).html('');
    if(notify_change==null || notify_change==true){
        showModifiedApSsid();
    }
    showTooltips();
}

/**
 * Creates a row for the specified row_index, that represents an ap ssid that can be imported to the network ssids
 * ssid info ok
 */
function parseSsidConflicts_fix_import(identifier,row_index,ssid1,ssid_on,notify_change){
    var text=$('#ap_fix2').attr("value");
    text=text.replace("__SSID__",htmlEntities(ssid1));
    if(ssid_on==1){
        text=text.replace("__SSID_ENABLE__","selected");
        text=text.replace("__SSID_DISABLE__","");
    }
    else{
        text=text.replace("__SSID_ENABLE__","");
        text=text.replace("__SSID_DISABLE__","selected");
    }
    text=text.replace("__INDEX__",row_index);
    text=text.replace("__SSID_VNAME__",identifier);
    text=text.replace("__SSID_VNAME__",identifier);
    if(ssid_on==1){
        text=text.replace("__SSID_CHECKED__"," checked=\"checked\" ");
    }
    else{
        text=text.replace("__SSID_CHECKED__","");
    }
    
    /* SSID INFO SECTION*/
    var ssidid=identifier.replace("f_netssid_","").replace("f_apssid_","");
    text=text.replace(/__SSID_ID__/g,ssidid);
    text=text.replace(/__SSID_AUTH__/g,rows_ssid[row_index]["auth_1"]);
    text=text.replace(/__SSID_BROADCAST__/g,rows_ssid[row_index]["broadcast_1"]);
    text=text.replace(/__SSID_ISOLATION__/g,rows_ssid[row_index]["isolation_1"]);
    text=text.replace(/__SSID_PASS__/g,rows_ssid[row_index]["password_1"]);
    if(rows_ssid[row_index]["linkid"]!=""){
        text=text.replace(/__SSID_DISPLAY_A_/g,"");
        text=text.replace(/__SSID_LINKID__/g,rows_ssid[row_index]["linkid"]);
    }
    else{
        text=text.replace(/__SSID_DISPLAY_A_/g,"  style='display:none' ");
    }
    if(rows_ssid[row_index]["auth_1"]=="Open" || rows_ssid[row_index]["auth_1"]=="Captive Portal"){
        text=text.replace(/__SSID_DISPLAY_PASSWORD__/g,"  style='display:none' ");
    }
    else{
        text=text.replace(/__SSID_DISPLAY_PASSWORD__/g,"");
    }
    
    $("#ssid_tr_"+row_index).html(text);
    
    text=$('#ap_fix2_popup').attr("value");
    text=text.replace(/__INDEX__/g,row_index);
    text=text.replace(/__SSID__/g,htmlEntities(ssid1)); 
    
    $("#fix_ssid_tr_"+row_index).html(text);
    if(notify_change==null || notify_change==true){
        showModifiedApSsid();
    }
    showTooltips();
}
/**
 * Creates a row for the specified row_index, that represents an ap ssid that is in conflict with the net version of the ssid
 */
function parseSsidConflicts_fix_conflict(identifier,row_index,ssid1,ssid_on,notify_change){
    var text=$('#ap_fix').attr("value");
    text=text.replace("__SSID__",htmlEntities(ssid1));
    text=text.replace("__SSID__",htmlEntities(ssid1));
    text=text.replace("__INDEX__",row_index);
    if(ssid_on==1){
        text=text.replace("__SSID_ENABLE__","selected");
        text=text.replace("__SSID_DISABLE__","");
    }
    else{
        text=text.replace("__SSID_ENABLE__","");
        text=text.replace("__SSID_DISABLE__","selected");
    }
    text=text.replace("__SSID_VNAME__",identifier);
    text=text.replace("__SSID_VNAME__",identifier);
    if(ssid_on==1){
        text=text.replace("__SSID_CHECKED__"," checked=\"checked\" ");
    }
    else{
        text=text.replace("__SSID_CHECKED__","");
    }
    
    /* SSID INFO SECTION*/
    var ssidid=identifier.replace("f_netssid_","").replace("f_apssid_","");
    text=text.replace(/__SSID_ID__/g,ssidid);
    text=text.replace(/__SSID_AUTH__/g,rows_ssid[row_index]["auth_1"]);
    text=text.replace(/__SSID_BROADCAST__/g,rows_ssid[row_index]["broadcast_1"]);
    text=text.replace(/__SSID_ISOLATION__/g,rows_ssid[row_index]["isolation_1"]);
    text=text.replace(/__SSID_PASS__/g,rows_ssid[row_index]["password_1"]);
    text=text.replace(/__SSID_DISPLAY_A_/g,"  style='display:none' ");

    if(rows_ssid[row_index]["auth_1"]=="Open" || rows_ssid[row_index]["auth_1"]=="Captive Portal"){
        text=text.replace(/__SSID_DISPLAY_PASSWORD__/g,"  style='display:none' ");
    }
    else{
        text=text.replace(/__SSID_DISPLAY_PASSWORD__/g,"");
    }
    
    var secondPart=$('#ap_stock_ssid_info').attr("value");
    
    var ssidid_2=identifier.replace("f_netssid_","").replace("f_apssid_","")+"conflict";
    secondPart=secondPart.replace("__SSID__",htmlEntities(ssid1));
    secondPart=secondPart.replace(/__SSID_ID__/g,ssidid_2);
    secondPart=secondPart.replace(/__SSID_AUTH__/g,rows_ssid[row_index]["auth_2"]);
    secondPart=secondPart.replace(/__SSID_BROADCAST__/g,rows_ssid[row_index]["broadcast_2"]);
    secondPart=secondPart.replace(/__SSID_ISOLATION__/g,rows_ssid[row_index]["isolation_2"]);
    secondPart=secondPart.replace(/__SSID_PASS__/g,rows_ssid[row_index]["password_2"]);
    if(rows_ssid[row_index]["auth_2"]=="Open"){
        secondPart=secondPart.replace(/__SSID_DISPLAY_PASSWORD__/g,"  style='display:none' ");
    }
    else{
        secondPart=secondPart.replace(/__SSID_DISPLAY_PASSWORD__/g,"");
    }
    if(rows_ssid[row_index]["linkid"]!=""){
        secondPart=secondPart.replace(/__SSID_DISPLAY_A_/g,"");
        secondPart=secondPart.replace(/__SSID_LINKID__/g,rows_ssid[row_index]["linkid"]);
    }
    else{
        secondPart=secondPart.replace(/__SSID_DISPLAY_A_/g,"  style='display:none' ");
    }
    
    text=text.replace(/__SSID_PLACEHOLDER__/g,secondPart);
    
    $("#ssid_tr_"+row_index).html(text);
    
    text=$('#ap_fix_popup').attr("value");
    text=text.replace("__SSID__",htmlEntities(ssid1));
    text=text.replace("__SSID__",htmlEntities(ssid1));
    
    text=text.replace(/__INDEX__/g,row_index);
    
    
    
    $("#fix_ssid_tr_"+row_index).html(text);
    if(notify_change==null || notify_change==true){
        showModifiedApSsid();
    }
    showTooltips();
}
/**
 * Creates a row for the specified row_index, that represents an ap ssid that has been deleted
 */
function parseSsidConflicts_delete(identifier,row_index,ssid1,notify_change){
    var text=$('#ap_delete').attr("value");
    text=text.replace("__SSID__",htmlEntities(ssid1));
    text=text.replace("__SSID__",htmlEntities(ssid1));
    text=text.replace("__SSID_VNAME__",identifier);
    text=text.replace("__SSID_VNAME__",identifier);
    $("#ssid_tr_"+row_index).html(text);
    $("#fix_ssid_tr_"+row_index).html('');
    if(notify_change==null || notify_change==true){
        showModifiedApSsid();
    }
}
function showFixBox(row_index){
    var elements=$(".fix");
    for(var i=0;i<elements.length;i++){
        if(elements[i].id!=('fix_ssid_tr_'+row_index)){
            $(elements[i]).hide();
        }
    }
    if($("#fix_ssid_tr_"+row_index).css("display") != "none"){
        $("#fix_ssid_tr_"+row_index).hide();
    }
    else{
        $("#fix_ssid_tr_"+row_index).fadeIn("slow");
    }    
    updateMainSize();
}
/**
 * Function that handles fix problem for case in which the ap ssid can be imported
 */
function confirmSsidImportSelection(row_index){
    var choice=0;
    if($("#ssid_fix_"+row_index+"_import_choice_0").attr("checked")=="checked"){
        choice=0;
    }
    if($("#ssid_fix_"+row_index+"_import_choice_1").attr("checked")=="checked"){
        choice=1;
    }
    if($("#ssid_fix_"+row_index+"_import_choice_2").attr("checked")=="checked"){
        choice=2;
    }
    switch(choice){
        case 0:
            //Delete SSID "X" settings IN AP "Y"
            rows_ssid[row_index]['status']=4;
            rows_ssid[row_index]['ssid_on']=0;
            parseSsidConflicts_delete(rows_ssid[row_index]['identifier'],row_index, rows_ssid[row_index]['ssid1']);
            bindClickOnSsidCheckbox();
            animateButtons();
            updateMainSize();
            break;
        case 1:
            //Add SSID "X" settings to "Y" SSIDs
            rows_ssid[row_index]['status']=0;
            rows_ssid[row_index]['ssid1']=rows_ssid[row_index]['ssid1'];
            rows_ssid[row_index]['ssid2']=rows_ssid[row_index]['ssid1'];
            rows_ssid[row_index]['ssid_on']=2;
            parseSsidConflicts_ok_import(rows_ssid[row_index]['identifier'],row_index, rows_ssid[row_index]['ssid1'], rows_ssid[row_index]['ssid_on']);
            $("#ssid_tr_"+row_index+" .actionContainer").html('<input type="hidden" name="'+rows_ssid[row_index]['identifier']+'_import" value="false" />');
            bindClickOnSsidCheckbox();
            animateButtons();
            updateMainSize();
            break;
        case 2:
            showFixBox(row_index);
            break;
    }
    
}
function confirmSsidConflictSelection(row_index){
    var choice=0;
    if($("#ssid_fix_"+row_index+"_conflict_choice_0").attr("checked")=="checked"){
        choice=0;
    }
    if($("#ssid_fix_"+row_index+"_conflict_choice_1").attr("checked")=="checked"){
        choice=1;
    }
    if($("#ssid_fix_"+row_index+"_conflict_choice_2").attr("checked")=="checked"){
        choice=2;
    }
    switch(choice){
        case 0:
            rows_ssid[row_index]['status']=0;
            rows_ssid[row_index]['ssid1']=rows_ssid[row_index]['ssid1'];
            rows_ssid[row_index]['ssid2']=rows_ssid[row_index]['ssid1'];
            rows_ssid[row_index]['auth_1']=rows_ssid[row_index]['auth_2'];
            rows_ssid[row_index]['password_1']=rows_ssid[row_index]['password_2'];
            rows_ssid[row_index]['isolation_1']=rows_ssid[row_index]['isolation_2'];
            rows_ssid[row_index]['broadcast_1']=rows_ssid[row_index]['broadcast_2'];
            parseSsidConflicts_ok(rows_ssid[row_index]['conflict_identifier'],row_index, rows_ssid[row_index]['ssid1'], rows_ssid[row_index]['ssid_on']);
            $("#ssid_tr_"+row_index+" .actionContainer").html('<input type="hidden" name="'+rows_ssid[row_index]['identifier']+'" value="deleted" />');
            bindClickOnSsidCheckbox();
            animateButtons();
            updateMainSize();
            break;
        case 1://not used
            rows_ssid[row_index]['status']=1;
            rows_ssid[row_index]['ssid_on']=0;
            parseSsidConflicts_sync(rows_ssid[row_index]['identifier'],row_index, rows_ssid[row_index]['ssid2']);
            bindClickOnSsidCheckbox();
            animateButtons();
            updateMainSize();
            break;
        case 2:
            showFixBox(row_index);
            break;
    }
}

function showModifiedApSsid(){
    showModifiedSection(3);
}
function showUnModifiedApSsid(){
    showUnModifiedSection(3);
}
function countEnabledCheckbox(){
    return $('#control input[name^="f_"]:checked').length;
}
if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str){
        return this.indexOf(str) == 0;
    };
}

function bindClickOnSsidCheckbox(){
    $("#control .cb-enable").unbind('click');
    $("#control .cb-disable").unbind('click');
    $("#control .cb-enable").click(function(){
        if($(this).hasClass("selected")){
            return;
        }
        if(countEnabledCheckbox($("#control input:checked").length)>=maxAis){
            alert("Max number of possible ssid reached");
            return;
        }
        var parent = $(this).parents('.switch');
        if($('.checkbox',parent)!=null && $('.checkbox',parent).length>0){
            var name=$('.checkbox',parent).attr('name');
            if(name!=null){
                for(var i=0;i<rows_ssid.length;i++){
                    if(rows_ssid[i]["identifier"]==name || (rows_ssid[i]["conflict_identifier"]!=null && rows_ssid[i]["conflict_identifier"]==name)){
                        if(rows_ssid[i]["auth_1"]=="Captive Portal"){
                            //check if one is already on
                            for(var k=0;k<rows_ssid.length;k++){
                                if(k!=i && rows_ssid[k]["ssid_on"]==1 && rows_ssid[k]["auth_1"]=="Captive Portal"){
                                    alert("Only 1 captive portal at a time can be enabled on a device");
                                    return;
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }else{
            var parent_td = $(this).parents('td');
            var name_hidden=$(':hidden',parent).attr('name');
            for(var i_hidden=0;i_hidden<rows_ssid.length;i_hidden++){
                if(rows_ssid[i_hidden]["identifier"]==name_hidden){
                    if(rows_ssid[i_hidden]["auth_1"]=="Captive Portal"){
                        //check if one is already on
                        for(var k=0;k<rows_ssid.length;k++){
                            if(k!=i && rows_ssid[k]["ssid_on"]==1 && rows_ssid[k]["auth_1"]=="Captive Portal"){
                                alert("Only 1 captive portal at a time can be enabled on a device");
                                return;
                            }
                        }
                    }
                    break;
                }
            }
        }
        var parent = $(this).parents('.switch');
        $('.cb-disable',parent).removeClass('selected');
        $(this).addClass('selected');
        if($('.checkbox',parent)!=null && $('.checkbox',parent).length>0){
            $('.checkbox',parent).attr('checked', true);
            var name=$('.checkbox',parent).attr('name');
            if(name!=null){
                for(var i=0;i<rows_ssid.length;i++){
                    if(rows_ssid[i]["identifier"]==name || (rows_ssid[i]["conflict_identifier"]!=null && rows_ssid[i]["conflict_identifier"]==name)){
                        rows_ssid[i]["ssid_on"]=1;
                        break;
                    }
                }
                if(name.startsWith("f_netssid_")){
                    $("#".name).attr("value","t");
                }
            }
        }else{
            var parent_td = $(this).parents('td');
            if($('input[name^="f_disprofssid"]',parent_td)!=null){
                $('input[name^="f_disprofssid"]',parent_td).attr("value","true");  
            }
            if($('input[name^="f_apssid"]',parent_td)!=null){
                $('input[name^="f_apssid"]',parent_td).attr("value","true");  
            }
            var name_hidden=$(':hidden',parent).attr('name');
            if(name_hidden!=null){
                for(var i_hidden=0;i_hidden<rows_ssid.length;i_hidden++){
                    if(rows_ssid[i_hidden]["identifier"]==name_hidden){
                        rows_ssid[i_hidden]["ssid_on"]=1;
                        break;
                    }
                }
            }
        }
        checkSsidModified();
    });
    $("#control .cb-disable").click(function(){
        if(countEnabledCheckbox($("#control input:checked").length)<=minAis){
            if(minAis!=0){
                alert("At least 1 ssid must be switched on");
                return;
            }
        }
        var parent = $(this).parents('.switch');
        $('.cb-enable',parent).removeClass('selected');
        $(this).addClass('selected');
        if($('.checkbox',parent)!=null && $('.checkbox',parent).length>0){
            $('.checkbox',parent).attr('checked', false);
            var name=$('.checkbox',parent).attr('name');
            if(name!=null){
                for(var i=0;i<rows_ssid.length;i++){
                    if(rows_ssid[i]["identifier"]==name || (rows_ssid[i]["conflict_identifier"]!=null && rows_ssid[i]["conflict_identifier"]==name)){
                        rows_ssid[i]["ssid_on"]=2;
                        break;
                    }
                }
                if(name.startsWith("f_netssid_")){
                    $("#".name).attr("value","f");
                }
            }
        }
        else{// if import from disabled swapped profile
            var parent_td = $(this).parents('td');
            if($('input[name^="f_disprofssid"]',parent_td)!=null){
                $('input[name^="f_disprofssid"]',parent_td).attr("value","false");  
            }
            var name_hidden=$(':hidden',parent).attr('name');
            if(name_hidden!=null){
                for(var i_hidden=0;i_hidden<rows_ssid.length;i_hidden++){
                    if(rows_ssid[i_hidden]["identifier"]==name_hidden){
                        rows_ssid[i_hidden]["ssid_on"]=2;
                        break;
                    }
                }
            }
        }
        
        checkSsidModified();
    });
}
function checkSsidModified(){
    dd_generateInternetTable();
    internetConnectionSectionValidation();
    for(var i=0;i<rows_ssid.length && i< rows_ssid_start.length;i++){
        if(rows_ssid[i]["identifier"]!=rows_ssid_start[i]["identifier"] ||
            rows_ssid[i]["ssid1"]!=rows_ssid_start[i]["ssid1"] ||
            rows_ssid[i]["ssid2"]!=rows_ssid_start[i]["ssid2"] ||
            rows_ssid[i]["status"]!=rows_ssid_start[i]["status"] ||
            rows_ssid[i]["ssid_on"]!=rows_ssid_start[i]["ssid_on"] ||
            rows_ssid[i]["index"]!=rows_ssid_start[i]["index"] ){
            showModifiedSection(3);
            return;
        }
    }
    showUnModifiedSection(3);
    
}

/**
 * Creates a row for the specified row_index, that represents an ap ssid that can be imported to the network ssids
 */
function parseSsidConflicts_fix_importDisabled(identifier,row_index,ssid1,ssid_on,notify_change){
    var text=$('#ap_fix2').attr("value");
    text=text.replace("__SSID__",htmlEntities(ssid1));
    if(ssid_on==1){
        text=text.replace("__SSID_ENABLE__","selected");
        text=text.replace("__SSID_DISABLE__","");
    }
    else{
        text=text.replace("__SSID_ENABLE__","");
        text=text.replace("__SSID_DISABLE__","selected");
    }
    text=text.replace("__INDEX__",row_index);
    text=text.replace("__SSID_VNAME__",identifier);
    text=text.replace("__SSID_VNAME__",identifier);
    if(ssid_on==1){
        text=text.replace("__SSID_CHECKED__"," checked=\"checked\" ");
    }
    else{
        text=text.replace("__SSID_CHECKED__","");
    }
    
    /* SSID INFO SECTION*/
    var ssidid=identifier.replace("f_netssid_","").replace("f_apssid_","");
    text=text.replace(/__SSID_ID__/g,ssidid);
    text=text.replace(/__SSID_AUTH__/g,rows_ssid[row_index]["auth_1"]);
    text=text.replace(/__SSID_BROADCAST__/g,rows_ssid[row_index]["broadcast_1"]);
    text=text.replace(/__SSID_ISOLATION__/g,rows_ssid[row_index]["isolation_1"]);
    text=text.replace(/__SSID_PASS__/g,rows_ssid[row_index]["password_1"]);
    if(rows_ssid[row_index]["linkid"]!=""){
        text=text.replace(/__SSID_DISPLAY_A_/g,"");
        text=text.replace(/__SSID_LINKID__/g,rows_ssid[row_index]["linkid"]);
    }
    else{
        text=text.replace(/__SSID_DISPLAY_A_/g,"  style='display:none' ");
    }
    if(rows_ssid[row_index]["auth_1"]=="Open" || rows_ssid[row_index]["auth_1"]=="Captive Portal"){
        text=text.replace(/__SSID_DISPLAY_PASSWORD__/g,"  style='display:none' ");
    }
    else{
        text=text.replace(/__SSID_DISPLAY_PASSWORD__/g,"");
    }
    $("#ssid_tr_"+row_index).html(text);
    
    text=$('#ap_fix2_popup').attr("value");
    text=text.replace(/__INDEX__/g,row_index);
   
    text=text.replace("__SSID__",htmlEntities(ssid1));
    text=text.replace("__SSID__",htmlEntities(ssid1));
    
    
    
    $("#fix_ssid_tr_"+row_index).html(text);
    if(notify_change==null || notify_change==true){
        showModifiedApSsid();
    }
    showTooltips();
}
/**
 * Creates a row for the specified row_index, that represents an ap ssid that is in conflict with the net version of the ssid
 */
function parseSsidConflicts_fix_conflictDisabled(identifier,row_index,ssid1,ssid_on,notify_change){
    var text=$('#ap_fix').attr("value");
    text=text.replace("__SSID__",htmlEntities(ssid1));
    text=text.replace("__SSID__",htmlEntities(ssid1));
    text=text.replace("__INDEX__",row_index);
    if(ssid_on==1){
        text=text.replace("__SSID_ENABLE__","selected");
        text=text.replace("__SSID_DISABLE__","");
    }
    else{
        text=text.replace("__SSID_ENABLE__","");
        text=text.replace("__SSID_DISABLE__","selected");
    }
    text=text.replace("__SSID_VNAME__",identifier);
    text=text.replace("__SSID_VNAME__",identifier);
    if(ssid_on==1){
        text=text.replace("__SSID_CHECKED__"," checked=\"checked\" ");
    }
    else{
        text=text.replace("__SSID_CHECKED__","");
    }
    
    /* SSID INFO SECTION*/
    var ssidid=identifier.replace("f_netssid_","").replace("f_apssid_","").replace("f_disprofssid_","");
    text=text.replace(/__SSID_ID__/g,ssidid);
    text=text.replace(/__SSID_AUTH__/g,rows_ssid[row_index]["auth_1"]);
    text=text.replace(/__SSID_BROADCAST__/g,rows_ssid[row_index]["broadcast_1"]);
    text=text.replace(/__SSID_ISOLATION__/g,rows_ssid[row_index]["isolation_1"]);
    text=text.replace(/__SSID_PASS__/g,rows_ssid[row_index]["password_1"]);
    text=text.replace(/__SSID_DISPLAY_A_/g,"  style='display:none' ");

    if(rows_ssid[row_index]["auth_1"]=="Open" || rows_ssid[row_index]["auth_1"]=="Captive Portal"){
        text=text.replace(/__SSID_DISPLAY_PASSWORD__/g,"  style='display:none' ");
    }
    else{
        text=text.replace(/__SSID_DISPLAY_PASSWORD__/g,"");
    }
    
    var secondPart=$('#ap_stock_ssid_info').attr("value");
    
    var ssidid_2=identifier.replace("f_netssid_","").replace("f_apssid_","")+"conflict";
    secondPart=secondPart.replace("__SSID__",htmlEntities(ssid1));
    secondPart=secondPart.replace(/__SSID_ID__/g,ssidid_2);
    secondPart=secondPart.replace(/__SSID_AUTH__/g,rows_ssid[row_index]["auth_2"]);
    secondPart=secondPart.replace(/__SSID_BROADCAST__/g,rows_ssid[row_index]["broadcast_2"]);
    secondPart=secondPart.replace(/__SSID_ISOLATION__/g,rows_ssid[row_index]["isolation_2"]);
    secondPart=secondPart.replace(/__SSID_PASS__/g,rows_ssid[row_index]["password_2"]);
    if(rows_ssid[row_index]["auth_2"]=="Open"){
        secondPart=secondPart.replace(/__SSID_DISPLAY_PASSWORD__/g,"  style='display:none' ");
    }
    else{
        secondPart=secondPart.replace(/__SSID_DISPLAY_PASSWORD__/g,"");
    }
    if(rows_ssid[row_index]["linkid"]!=""){
        secondPart=secondPart.replace(/__SSID_DISPLAY_A_/g,"");
        secondPart=secondPart.replace(/__SSID_LINKID__/g,rows_ssid[row_index]["linkid"]);
    }
    else{
        secondPart=secondPart.replace(/__SSID_DISPLAY_A_/g,"  style='display:none' ");
    }
    
    text=text.replace(/__SSID_PLACEHOLDER__/g,secondPart);
    
    $("#ssid_tr_"+row_index).html(text);
    
    text=$('#ap_fix_popup').attr("value");
    text=text.replace("__SSID__",htmlEntities(ssid1));
    text=text.replace("__SSID__",htmlEntities(ssid1));
    text=text.replace("__INDEX__",row_index);
    text=text.replace("__INDEX__",row_index);
    text=text.replace("__INDEX__",row_index);
    text=text.replace("__INDEX__",row_index);
    text=text.replace("__INDEX__",row_index);
    text=text.replace("__INDEX__",row_index);
    text=text.replace("__INDEX__",row_index);
    $("#fix_ssid_tr_"+row_index).html(text);
    if(notify_change==null || notify_change==true){
        showModifiedApSsid();
    }
    showTooltips();
}