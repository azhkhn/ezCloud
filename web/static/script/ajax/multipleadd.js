function selectAgent(choose_method) {
    
    if ( $("#selectAgent option:selected").text() == "Select Agent" ){
        $(choose_method).addClass('hidee');
        $(choose_method).removeClass('showw');
        $("input.regular-radio").removeAttr("checked");
    }else{
        $(choose_method).addClass('showw');
        $(choose_method).removeClass('hidee');
    }
          
}
var html_loading = '<div class="loadingX"></div>'; 
var template_ap_base_structure= [
    '<li id="{{ obj_name }}" class="ap-element">',
        '<div class="ap-icon ap-img2" >',
        '</div>',
        '<div class="ap-name">{{ source }}</div>',
        '<div class="ap-progress">',
            '<ul>',
                '<li class="running" >&nbsp;',
                	html_loading,
            		'<div class="ap-title-status">Testing Connectivity..</div>',
                '</li>',
                '<li >&nbsp;',
                	html_loading,
                    '<div class="ap-title-status">Accessing Device info..</div>',
                '</li>',
                '<li >&nbsp;',
                	html_loading,
                	'<div class="ap-title-status">synchronizing Device..</div>',
                '</li>',
                '<li>&nbsp;',
                	html_loading,	                    
                	'<div class="ap-title-status">Added Successfully..</div>',
                '</li>',
            '</ul>',
            '</div>',
            '<a id="{{ source2 }}" onclick="ap_del_process(this); return false;" href="#" class="elementclose">X</a>',
            '<div class="Msg">',
            '</div>',
            '<div class="cleared"></div>',
        '</li>'    
].join('');
var ap_add=new Array();
var STATUS_WAITING_FOR_ID="0";
var STATUS_ID_ASSIGNED="1";
var STATUS_ABORTED="6";
var currentAddUnique=0;
var multiplAddTimer=null;
function ap_data_parse_and_layout(){
    for(var kk=0;kk<ap_add.length;kk++){
        var device=ap_add[kk];
        var newmac=device["macAddress"];
        ap_add_new_ap(newmac,false);
        ap_change_status(newmac,ap_add[kk]["step"],1,ap_add[kk]["error"],ap_add[kk]["msg"]);
    }
}
function ap_data_start(){
    currentAddUnique++;
    if(multiplAddTimer!=null){
        clearTimeout(multiplAddTimer);
    }
    multiplAddTimer=setTimeout("ap_data_update_status('"+currentAddUnique+"')", 100);
}
function ap_data_export(){
    var result="";
    for(var kk=0;kk<ap_add.length;kk++){
        var device=ap_add[kk];
        result+="apadd_mac_"+escape(device["macAddress"])+"="+escape(device["macAddress"])+"&apadd_id_"+escape(device["macAddress"])+"="+device["id"]+"&apadd_status_"+escape(device["macAddress"])+"="+device["status"];
        if(kk!=ap_add.length-1){
            result+="&";
        }
    }
    return result;
}
function ap_data_update_status(unique){
    if(currentAddUnique!=unique){
        return;
    }    
    var params="action=ajaxMultipleAddStatus";
    var timestampId=new Date().getTime();
    params=params+"&timestampId="+timestampId;
    params=params+"&tz="+tsDiff;
    params=params+"&"+ap_data_export();
    $.post(getServer()+"index.php?", params, function(data) {
        if($("#placeholder_multipleadd").attr("value")!="true"){
            //console.log("left add ap page");
            return;
        }
        if(currentAddUnique==unique){
            if(data.status!=null){
                ap_data_update_status_execute(data.status);
            }
            if(multiplAddTimer!=null){
                clearTimeout(multiplAddTimer);
            }
            multiplAddTimer=setTimeout("ap_data_update_status('"+unique+"')", 2000);
        }
    },'jsonp');
}
function ap_data_event(command,id,mac){
    var params="action=ajaxMultipleAddEvent&command="+command+"&id="+(id!=null?id:"")+"&mac="+(mac!=null?encodeURI(mac):"");
    $.post(getServer()+"index.php?", params, function(data) {
        if($("#placeholder_multipleadd").attr("value")!="true"){
            //console.log("left add ap page");
            return;
        }
        if(data.status!=null){
            var status=data.status;
            for(var i=0;i<status.length;i++){
                var op=status[i];
                var mac2=op["mac_address"];
                for(var m=0;m<ap_add.length;m++){
                    if(mac2==ap_add[m]["macAddress"]){  
                        if(command=="addAp"){
                            ap_add[m]["id"]=op["id"];
                            ap_add[m]["status"]=STATUS_ID_ASSIGNED;                            
                            break;
                        }
                        else{
                            if(command=="abort"){
                                ap_add.splice(m, 1);
                                break;
                            }
                        }
                    }
                }
            }
        }
    },'jsonp');
}
function ap_data_update_status_execute(status){
    if(status!=null){
        for(var i=0;i<status.length;i++){
            var op=status[i];
            var mac=op["mac_address"];
            var newmac=mac;      
            for(var m=0;m<ap_add.length;m++){
                if(mac==ap_add[m]["macAddress"]){                    
                    if(op["error"]!="0"){
                        //an error occured
                        ap_add[m]["step"]=op["step"];
                        ap_add[m]["error"]=op["error"];
                        ap_add[m]["msg"]=op["msg"];
                        ap_change_status(newmac,ap_add[m]["step"],3,ap_add[m]["error"],ap_add[m]["msg"]);
                    }
                    else{
                        if(ap_add[m]["step"]!=op["step"]){
                            if(op["step"]=="4"){
                            //slow down new status
                                slowdown(newmac,2,1,0,"");
                            }
                            else{
                                ap_change_status(newmac,op["step"],1,0,"");
                            }
                        }
                        ap_add[m]["step"]=op["step"];
                    }
                    break;
                }
            }
            //console.log(op);
        }
    }
}
function slowdown(source,op,st,error,msg){
    if(op==4){
        ap_change_status(source,4,2,0,"");
    }    
    else{
        //console.log("Slowing down:"+op); 
        ap_change_status(source,op,st,0,"");
        setTimeout("slowdown('"+source+"',"+(op+1)+",1,0,'');", 1500);
    }
}
function ap_data_add_app(macAddress){
    ap_data_event("addAp", "", macAddress);
    //console.log("Adding ap:"+macAddress);
    var device=new Array();
    device["macAddress"]=macAddress;
    device["status"]=""+STATUS_WAITING_FOR_ID;
    device["error"]="0";
    device["step"]="1";
    device["id"]="";
    ap_add.push(device);    
    //console.log("Added ap");
    //console.log(ap_add); 
}
function ap_data_get(macAddress,parameter){
    if(ap_add!=null && ap_add[macAddress]!=null && ap_add[macAddress][parameter]!=null){
        return ap_add[macAddress][parameter];
    }
    return null;
}
function ap_data_set(macAddress,parameter,value){
    if(ap_add!=null && ap_add[macAddress]!=null ){
        ap_add[macAddress][parameter]=value;
        return true;
    }
    return false;
}
function ap_add_process(){
    var macAddress = $('input[id=MACtxt]').val();
    macAddress = macAddress.replace(/^\s+|\s+$/g, '');
    ap_add_new_ap(macAddress,true);
    $('input[id=MACtxt]').attr("value","");
    $('#bttnAdd').removeClass("okbttnAdd");
}
function ap_add_new_ap(macAddress,addToDataStructure) {
    if (isValidMac(macAddress) == true ) {
		
        var tp 		= "MAC";
        var macAddress_clean=macAddress.replace(/\:/g, '').toUpperCase();
        var obj_name= tp+"_"+macAddress_clean;
        var source2 = "DEL_"+obj_name;
        if($("li[id="+obj_name+"]").length == 0) {

            $("#main").height("+=200");
            var op_str= template_ap_base_structure;
            op_str=op_str.replace('{{ obj_name }}', obj_name);
            op_str=op_str.replace('{{ source }}', macAddress);
            op_str=op_str.replace('{{ source2 }}', source2);
            
            $('ul[id=install-grid] li').first().before(op_str);
            if(addToDataStructure){
                ap_data_add_app(macAddress);
            }
            ap_change_status( macAddress ,1,1,0,''); 
				  
        /* For testing.
				    ap_change_status(source,op,st,error,msg);				    
				    ap_change_status( source ,2,3,1,''); 
				    */
				  
        // tanaza_multipleAdd(source,true);
            $("#MACtxt").removeClass("errr");	
        } else {	  
            $("#MACtxt").addClass("errr");
            alert('this Device already in this list');
        }
    }else {
    	$("#MACtxt").addClass("errr");
        alert('Invalid Mac address');
    }
    updateMainSize();

}

function ap_del_process(obj){
    var id =  "";
    id =  $(obj).attr("id");
    id = id.replace("DEL_","");	
    var mac = id.replace("MAC_","");
    var mac_dotted=mac.substr(0,2)+":"+mac.substr(2,2)+":"+mac.substr(4,2)+":"+mac.substr(6,2)+":"+mac.substr(8,2)+":"+mac.substr(10,2);
    for(var m=0;m<ap_add.length;m++){
        if(mac_dotted==ap_add[m]["macAddress"]){  
           ap_data_event("abort", ap_add[m]["id"], mac_dotted);
           break;
        }
    }
    id = "#"+id;	
    remove_process_line(id,"");
// tanaza_multipleAdd(source,false);
}

function remove_process_line(source_id,remove_title) {
    $(source_id).fadeOut(1000, function () {
    	$(source_id).remove();
    	updateMainSize();
    });
	
}

function proceed_tanaza_ap(source,op,run) {

    var id = "#MAC_"+source.replace(/\:/g, '');	

    if (run == true){
        ap_change_status(source,op,1,0,'');

    // tanaza_multipleAdd(source,false);
			
    }else {
        remove_process_line(id,"");
    }	
}
	
function ap_change_status(source,op,st,error,msg){  
    op=parseInt(op+"");
    st=parseInt(st+"");
    if(op==4){
        st=2;
    }
    error=parseInt(error);
    /*  			
    Syntax: 
            ap_change_status(source,op,st,error,msg)

    Parameters:
            op = { 1,2,3,4) op[n]
            st = {1=running,2=done,3=error}
            error = {1,...,n}
            msg = string info.

    Example:
            ap_change_status('AABBCCDDEEAB',1,1,1,'')   
            ap_change_status('AA:BB:CC:DD:EE:AB',1,1,1,'')
    */
		
    var mac = source.replace(/\:/g, '');
    var opl = op -1;
    var OpSt = [ "","running", "done", "error" ]; 
    var Err = [];
    /* include 0 in done */
    var err0_template= [
    '<span style="float: left;vertical-align:middle;line-height:30px">Access Point Succefully Added</span>',
    '<div style="margin-left:10px;float:right;clear:none;width:auto;margin: 0px 10px;" id="settings_bttn" class="bttn bttn_red">',
        '<a id="configure_{{ mac }}" onclick="multipleAdd_configure(this)" href="javascript:{void(0)}">',
            '<div class="bnt_image"><img src="static/images/button/conf_img_og.png" width="20"></div>&nbsp;Configure Ap',
        '</a><span></span>',
    '</div>',
    '<!--div style="opacity: 1;float:right;clear:none;width:auto;margin: 0px 10px;" class="bttn bttn_red">',
        '<a id="locate_{{ mac }}" onclick="multipleAdd_locate(this)" href="javascript:{void(0)}">',
            '<div class="bnt_image"><img src="static/images/button/locate.png"></div>&nbsp;Locate on map',
        '</a><span></span>',
    '</div-->',
    
    '<div class="cleared"></div>'
    ];
    Err[0] = err0_template.join('');
    Err[1] = "<div class=\"op_frm_wrapper\"> <form name='frm_"+mac+"' ><div class=\"op_frm_msg\" > Remotetly added Access Point MAC :</div> <div class=\"op_frm_txt\" ><input name='txmac' value='"+source+"' /></div><div class=\"op_frm_bttn\" ><input type=\"button\"  onclick=\"proceed_tanaza_ap('"+source+"',"+op+",true);\" value=\"Accept\"/>   <input type=\"button\" onclick=\"proceed_tanaza_ap('"+source+"',"+op+",false);\" value=\"Decline\"/> </div></form></div>";
    Err[2] = "<div class=\"op_frm_wrapper\"> <form name='frm_"+mac+"' ><div class=\"op_frm_msg_large\" > Device with MAC : &nbsp;<i>"+source+"</i> &nbsp; &nbsp; is Online</div> <div class=\"op_frm_bttn\" ><input type=\"button\" onclick=\"proceed_tanaza_ap('"+source+"',"+op+",true);\" value=\"Proceed\"/> <input type=\"button\" onclick=\"proceed_tanaza_ap('"+source+"',"+op+",false);\" value=\"Abort\"/> </div></form> </div>";
    Err[3] = "Device with MAC: <strong>"+source+"</strong>, Not Connected.. <br/>(If you resetted the device while adding it please consider to delete this operation and retry) ";
    Err[4] = "Device with MAC: <strong>"+source+"</strong>, is Added by other User ";
    Err[5] = "Your Device isn't Tanaza powered, you have to try add it, for compatible option..";

    var target = "#MAC_" + mac.replace(/\:/g, '');	
    Err[0]=Err[0].replace("{{ mac }}",mac.replace(/\:/g, '')); 
    Err[0]=Err[0].replace("{{ mac }}",mac.replace(/\:/g, '')); 
    var objj = "";
    for(var t=1;t<=4;t++){
        if(t<op){
            objj = target+" .ap-progress ul li:nth-child("+t+")";
            $(objj).attr('class', 'done');
        }else{
            if (t==op) {
                objj = target+" .ap-progress ul li:nth-child("+t+")";
                $(objj).attr('class', 'done');
            }else{
                objj = target+" .ap-progress ul li:nth-child("+t+")";
                $(objj).attr('class', '');
            }
        }
    }		

    objj = target+" .ap-progress ul li:nth-child("+op+")";		
    $(objj).attr('class', '');
    $(objj).addClass(OpSt[st]);
    
    objj = target+" .Msg";
    
    var icon_objj = target+" .ap-icon";
    	
    $(icon_objj).attr('class', 'ap-icon ap-img2'); // Clear status Styles


    if(error > 0 ) {
        objj = target+" .Msg";
			
        $(objj).removeClass("Active");			
        $(objj).removeClass("error");

        $(objj).addClass("Active");			
        if(error > 2 ) {
            $(objj).addClass("error");
            $(icon_objj).addClass("ap_offline");
        }else {
        	$(icon_objj).addClass("ap_problem");
        }

        if(msg == null || msg=='' ) {
            $(objj).html(Err[error]);
        } else {
            $(objj).html(msg);
        }
    }else {
    	
        if(op == 4 && st == 2) {
    		$(objj).removeClass("error");
    		$(objj).removeClass("Active");
    		
    		$(objj).html(Err[0]);
    		$(objj).addClass("Active");
    		
    		$(objj).addClass("msg_done");

    		$(icon_objj).addClass("ap_done");
	    }else {    	
	        
	    	$(objj).removeClass("Active");
	        $(objj).removeClass("error");
	        $(objj).html(""); 
	    }
        
    }
    animateButtons();
    updateMainSize();
}
function multipleAdd_configure(source){
    var mac=source.id.replace("configure_","");
    var mac_dotted=mac.substr(0,2)+":"+mac.substr(2,2)+":"+mac.substr(4,2)+":"+mac.substr(6,2)+":"+mac.substr(8,2)+":"+mac.substr(10,2);
    for(var m=0;m<ap_add.length;m++){
        if(mac_dotted==ap_add[m]["macAddress"]){  
           configure_accessPoint_settings_byopid(ap_add[m]["id"]);
           break;
        }
    }
}
function multipleAdd_locate(source){
    var mac=source.id.replace("locate_","");
    var mac_dotted=mac.substr(0,2)+":"+mac.substr(2,2)+":"+mac.substr(4,2)+":"+mac.substr(6,2)+":"+mac.substr(8,2)+":"+mac.substr(10,2);
    for(var m=0;m<ap_add.length;m++){
        if(mac_dotted==ap_add[m]["macAddress"]){  
           configure_accessPoint_settings_byopid(ap_add[m]["id"]);
           break;
        }
    }
}