/**
 * Updates the image and the mouseover info for aps list on left menu
 */
var X_INPUT_IP = 1;
var X_INPUT_NUM = 2;
var X_INPUT_HEX = 3;
var X_INPUT_ID = 4;
var X_INPUT_MAC = 5;
var X_INPUT_PASSWD = 6;
var X_INPUT_LVM = 7;
var X_INPUT_URL = 8;
var X_INPUT_DIGITMAP = 9;
var X_INPUT_PHONENUM = 10;
var X_INPUT_ICCODE = 11;
var X_INPUT_IPV6 = 12;
var X_INPUT_VLANMEM = 13;
var X_INPUT_IDANDCH=14
function OnKeyPress(e, type)
{
	var	k = 0;
	var	c;

	if (window.event)
	{
		k = e.keyCode;
	}
	else if (e.which)
	{
		k = e.which;
	}

	if (k == 8 || k == 0)
	{
		return true;
	}

	c = String.fromCharCode(k);

	switch (type)
	{
	case	X_INPUT_IP:
		return KeyPressIP(c);

	case	X_INPUT_NUM:
		return KeyPressNUM(c);

	case	X_INPUT_HEX:
		return KeyPressHEX(c);

	case	X_INPUT_ID:
		return KeyPressID(c);

	case	X_INPUT_MAC:
		return KeyPressMAC(c);

	case	X_INPUT_PASSWD:
		return KeyPressPasswd(c);

	case	X_INPUT_LVM:
		return KeyPressLVM(c);

	case	X_INPUT_URL:
		return KeyPressURL(c);

	case	X_INPUT_DIGITMAP:
		return KeyPressDigitmap(c);
		
	case	X_INPUT_PHONENUM:
		return KeyPressPHONENUM(c);
		
	case  X_INPUT_ICCODE:
		return KeyPressICCODE(c);
	case    X_INPUT_IPV6:
        	return KeyPressIPV6(c);
  case  X_INPUT_VLANMEM:
  	return KeyPressVlanMem(c);
	}

	return false;
}
 
 
 
 function KeyPressIP(c)
{
	var ValidString = ".0123456789";

	return (-1 != ValidString.indexOf(c))?true:false;
}

function KeyPressNUM(c)
{
	var ValidString = "-.0123456789";

	return (-1 != ValidString.indexOf(c))?true:false;
}

function KeyPressHEX(c)
{
	var ValidString = "0123456789abcdefABCDEF";

	return (-1 != ValidString.indexOf(c))?true:false;
}

function KeyPressID(c)
{
	var InvalidString =  "\"\\\'/ :%$#&^*@!~?\t\r\n";

	return (-1 == InvalidString.indexOf(c))?true:false;
}

function KeyPressMAC(c)
{
	var ValidString = ":0123456789abcdefABCDEF";

	return (-1 != ValidString.indexOf(c))?true:false;
}

function KeyPressPasswd(c)
{
	var InvalidString = "\"\\\' :\t\n";

	return (-1 == InvalidString.indexOf(c))?true:false;
}

function KeyPressLVM(c)
{
	var ValidString = "0123456789/;";

	return (-1 != ValidString.indexOf(c))?true:false;
}

function KeyPressURL(c)
{
	var InvalidString = "\"\' \t\n";

	return (-1 == InvalidString.indexOf(c))?true:false;
}

function KeyPressDigitmap(c)
{
	var ValidString = "0123456789-()[]{}*#Xx.T|EtSL";

	return (-1 != ValidString.indexOf(c))?true:false;
}

function KeyPressPHONENUM(c)
{
	var ValidString = "+0123456789";
	
	return (-1 != ValidString.indexOf(c))?true:false;
}
function KeyPressICCODE(c)
{
	var ValidString = "*#0123456789";
	
	return (-1 != ValidString.indexOf(c))?true:false;
}

function KeyPressIPV6(c)
{
    var validString = "/:0123456789abcdefABCDEF";

    return (-1 != validString.indexOf(c))?true:false;
}

function KeyPressVlanMem(c)
{
    var validString = "-,0123456789";

    return (-1 != validString.indexOf(c))?true:false;
}

 
function isHexaDigit(digit) {
   var hexVals = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
                           "A", "B", "C", "D", "E", "F", "a", "b", "c", "d", "e", "f");
   var len = hexVals.length;
   var i = 0;
   var ret = false;

   for ( i = 0; i < len; i++ )
      if ( digit == hexVals[i] ) break;

   if ( i < len )
      ret = true;

   return ret;
}

function isValidHexKey(val, size) {
   var ret = false;
   if (val.length == size) {
      for ( i = 0; i < val.length; i++ ) {
         if ( isHexaDigit(val.charAt(i)) == false ) {
            break;
         }
      }
      if ( i == val.length ) {
         ret = true;
      }
   }

   return ret;
}

 



function checkvalue(name,type)
{
	
	if(X_INPUT_ID==type)
	{
		name.value=name.value.replace(/[^\a-\z\A-\Z0-9\- \_\.:]|\s/g,'')
	}
	if(X_INPUT_NUM==type)
	{
		name.value=name.value.replace(/[^\d]/g,'')
	}
	if(X_INPUT_IDANDCH==type)
	{
		name.value=name.value.replace(/[^\u4E00-\u9FA5\a-\z\A-\Z0-9\- \_\.:]|\s/g,'')
	}
	if(X_INPUT_PASSWD==type)
	{
		name.value=name.value.replace(/[^\a-\z\A-\Z0-9\- \_\(\)\"\\\'/ :%$#&^*@!~?]|\s/g,'')
	}
	
}
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
function updateLeftMenuApStatus(aps){
    for(var m=0;m<aps.length;m++){   
        if(aps[m].pending){
            $("#status_ap_img_"+aps[m].id).attr("src","static/images/loader-config.gif");
            $("#status_ap_img_"+aps[m].id).attr("alt","Loading Configuration");
            $("#status_ap_img_"+aps[m].id).attr("title","Loading Configuration");
        }
        else{
            if(aps[m].monitoring){
                if(!aps[m].hasData){
                    $("#status_ap_img_"+aps[m].id).attr("src","static/images/status_ap_offline.png");
                    $("#status_ap_img_"+aps[m].id).attr("alt",monitorMessage_yellow);
                    $("#status_ap_img_"+aps[m].id).attr("title",monitorMessage_yellow);
                }
                else{
                    if(aps[m].online){
                        $("#status_ap_img_"+aps[m].id).attr("src","static/images/status_ap_ok.png");
                        $("#status_ap_img_"+aps[m].id).attr("alt",monitorMessage_green);
                        $("#status_ap_img_"+aps[m].id).attr("title",monitorMessage_green);
                    } 
                    else{
                        $("#status_ap_img_"+aps[m].id).attr("src","static/images/status_ap_problem.png");
                        $("#status_ap_img_"+aps[m].id).attr("alt",monitorMessage_red);
                        $("#status_ap_img_"+aps[m].id).attr("title",monitorMessage_red);
                    }
                }
            }
            else{
                $("#status_ap_img_"+aps[m].id).attr("src","static/images/status_ap_nomonitor.png");
                $("#status_ap_img_"+aps[m].id).attr("alt","No monitoring info available");
                $("#status_ap_img_"+aps[m].id).attr("title","No monitoring info available");
            }
        }

    }
}
/**
 * Updates the image and the mouseover info for aps on map
 */
function updateMapApStatus(aps){
    for(var m=0;m<aps.length;m++){    
        if(markers[parseInt(aps[m].id)]==null){
            continue;
        }
        if(aps[m].pending){
            markers[parseInt(aps[m].id)].setIcon("static/images/loader-config.gif");
        }
        else{
            if(aps[m].monitoring){
                if(!aps[m].hasData){      
                    markers[parseInt(aps[m].id)].setIcon("static/images/status_ap_offline.png");
                }
                else{
                    if(aps[m].online){
                        markers[parseInt(aps[m].id)].setIcon("static/images/status_ap_ok.png");
                    } 
                    else{
                        markers[parseInt(aps[m].id)].setIcon("static/images/status_ap_problem.png");
                    }
                }
            }
            else{
                markers[parseInt(aps[m].id)].setIcon("static/images/status_ap_nomonitor.png");
            }
        }
    }
}
/**
 * Updates the image and the mouseover info for aps on map
 */
function updateMapApDbStatus(aps){
    for(var m=0;m<aps.length;m++){    
        if(markersAssDb[(aps[m].id)]==null){
            continue;
        }
        
        if(currentNetworkId==0 || aps[m].network==currentNetworkId+""){
            if(aps[m].pending){
                markersAssDb[parseInt(aps[m].id)].setIcon("static/images/loader-config.gif");
            }
            else{
                if(aps[m].monitoring){
                    if(!aps[m].hasData){      
                        markersAssDb[(aps[m].id)].setIcon("static/images/status_ap_offline.png");
                    }
                    else{
                        if(aps[m].online){
                            markersAssDb[(aps[m].id)].setIcon("static/images/status_ap_ok.png");
                        } 
                        else{
                            markersAssDb[(aps[m].id)].setIcon("static/images/status_ap_problem.png");
                        }
                    }
                }
                else{
                    markersAssDb[(aps[m].id)].setIcon("static/images/status_ap_nomonitor.png");
                }
            }
        }
        else{
            markersAssDb[(aps[m].id)].setIcon("static/images/accessPointGray.png");
        }
        
    }
}
function updateLeftMenuSsidStatus(aps){
    for(var m=0;m<aps.length;m++){   
        //console.log(aps[m].id+" "+aps[m].counter);
        if(aps[m].counter>0){
            $("#status_ssid_img_"+aps[m].id).attr("src","static/images/loader-config.gif");
            $("#status_ssid_img_"+aps[m].id).attr("alt","Ssid Profile");
            $("#status_ssid_img_"+aps[m].id).attr("title","Ssid Profile");
        }
        else{
            $("#status_ssid_img_"+aps[m].id).attr("src","static/images/ssid.png");
            $("#status_ssid_img_"+aps[m].id).attr("alt","Loading Configuration .. please wait");
            $("#status_ssid_img_"+aps[m].id).attr("title","Loading Configuration .. please wait");
        }

    }
}

function getURLParam()
{
	urlInfo=window.location.href; 
	len=urlInfo.length; 	
	offset=urlInfo.indexOf("?"); 
	strKeyValue=urlInfo.substr(offset,len); 
	arrParam=strKeyValue.split("="); 
	strParamValue=arrParam[1];
	return decodeURI(strParamValue);
}

function getURLMultiParam(name) 
{
   var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
   var r = window.location.search.substr(1).match(reg);
   if (r != null) 
   {
	  return decodeURI(r[2]);
   }
   else
   {
    return null;
   }
}

function randomcolor()
{
	var colorvalue=["0","2","3","4","5","6","7","8","9","a","b","c","d","e","f"], colorprefix="#", index=0;
	for(var i=0;i < 6; i++){
		index=Math.round(Math.random()*14);
		colorprefix+=colorvalue[index];
	}
	return colorprefix;
}



/*------------------------Data Sort API--------------------------------*/
function page_number_into(from_number,to_number,present_page,home_page,previous_page,next_page,end_page)
{
	var string_page="";
	var show_number="";
	var all_page=Math.ceil(back_all_number/number_space);
	if(home_page!= "" && previous_page!= "")
	{
		string_page+="<div class=\"page-int-device page_link_device\" onclick=\"postpagenumber("+1+")\">"+home_page+"</div>";
		string_page+="<div class=\"page-int-device\" onclick=\"postpagenumber("+(present_page-1)+")\">"+previous_page+"</div>";	
	}		
	for(var i=from_number;i<(to_number+1);i++)
	{
		if(i==present_page)
		{
			string_page+="<div class=\"page-int-device page_link_device\" onclick=\"postpagenumber("+i+")\">"+i+"</div>";	
		}
		else{
			string_page+="<div class=\"page-int-device\" onclick=\"postpagenumber("+i+")\">"+i+"</div>"	;
		}
	}
	if(end_page!= "" && next_page!= "")
	{
		string_page+="<div class=\"page-int-device\" onclick=\"postpagenumber("+(present_page+1)+")\">"+next_page+"</div>";
		string_page+="<div class=\"page-int-device page_link_device\" onclick=\"postpagenumber("+all_page+")\">"+end_page+"</div>";
	}
	$("#page_number").empty();
	$("#page_number").html(string_page);
	if(present_page==all_page)
		$("#Total").html("("+ (present_page*number_space-number_space+1)+"-"+back_all_number+"/"+back_all_number+")");
	else
		$("#Total").html("("+ (present_page*number_space-number_space+1)+"-"+present_page*number_space+"/"+back_all_number+")");
	return ;
}

function Calculation_page(start_from_number,number_space,back_all_number)
{
	var all_page=Math.ceil(back_all_number/number_space);
	var present_page=Math.ceil(start_from_number/number_space);
	var start_page_for3=Math.floor((present_page)/2)*2;
	
	if(all_page<=6)
	{
		page_number_into(1,all_page,present_page,"","","","");
	}
	else if(present_page<=6 && all_page>=6)
	{
		
		page_number_into(1,6,present_page,"","",">>",">|");
	}
	else if ((all_page-present_page)<=4)
	{
		page_number_into((all_page-4),all_page,present_page,"|<","<<","","");
	}
	else
	{
		page_number_into(start_page_for3,start_page_for3+2,present_page,"|<","<<",">>",">|");
	}	
}

function gotopage()
{
	var tmp=$("#input_number").val()
	if( isNaN(tmp) == true ||tmp =="")
	{
		alert(WebString.enter_number)
		$("#input_number").val("")
		return false
	}
	if(parseInt(tmp)<1 || parseInt(tmp)>Math.ceil(back_all_number/number_space) )
	{
		alert(WebString.digital_input+ Math.ceil(back_all_number/number_space))
		$("#input_number").val("")
		return false
	}
	 present_page=parseInt(tmp);
	 postpagenumber(present_page);
}

function show_pagination(back_all_number,number_space)
{
	var all_page=Math.ceil(back_all_number/number_space);
	var present_page=Math.ceil(start_from_number/number_space);
	if(Math.floor(present_page/10)==Math.ceil(present_page/10))
	{
		var start_page_for10=Math.floor(present_page/10)*10-9;
	}
	else
	{	var start_page_for10=Math.floor(present_page/10)*10+1;}

	var end_string="<div class=\"page-int\" id=\"next_page\" onclick=\"postpagenumber("+(present_page+1)+")\">"+WebString.Next+ "</div>"
		end_string+="<div class=\"page-int\" id=\"end_page\" onclick=\"postpagenumber("+(all_page)+")\">"+WebString.End+"</div>"
		if(present_page==all_page)
			end_string+="<div class=\"page-int\" id=\"total\" style=\"background-color:#1595b3; border-color:#1595b3; color:#FFF;\">("+start_from_number+"-"+back_all_number+"/"+back_all_number+")</div>"
		else
			end_string+="<div class=\"page-int\" id=\"total\" style=\"background-color:#1595b3; border-color:#1595b3; color:#FFF;\">("+start_from_number+"-"+(parseInt(start_from_number)+parseInt(number_space)-1)+"/"+back_all_number+")</div>"
	$("#next_page_end_page").html(end_string);
	
	var start_string="<div class=\"page-int\" id=\"index_page\" onclick=\"postpagenumber("+1+")\">"+WebString.Home+"</div>"
		start_string+="<div class=\"page-int\" id=\"fourt_page\" onclick=\"postpagenumber("+(present_page-1)+")\">"+WebString.Previous+"</div>"
	$("#index_page_fourt_page").html(start_string);
	if(Math.ceil(all_page/10)== Math.ceil(present_page/10))//已经在最后一页了
	{
		page_number_into_head(start_page_for10,all_page,present_page);
		$("#next_page").hide()
		$("#end_page").hide()
	}
	else
	{
		page_number_into_head(start_page_for10,(start_page_for10+9),present_page);

	}
	if(present_page<11)
	{
		$("#index_page").hide()
		$("#fourt_page").hide()
	}
}

function page_number_into_head(from_number,to_number,present_page)
{
	var string_page="";
	var show_number="";
	for(var i=from_number;i<(to_number+1);i++)
		{
			if(i==present_page)
			{
				string_page+="<div class=\"page-int\" style=\"background-color:#1595b3; border-color:#1595b3; color:#FFF;\" onclick=\"postpagenumber("+i+")\">"+i+"</div>";	
			}
			else{
				string_page+="<div class=\"page-int\" onclick=\"postpagenumber("+i+")\">"+i+"</div>"	;
			}
		}
	if(number_space==20)
	{
		$("#show20").addClass('page_link');
		$("#show50").removeClass('page_link');
	}
	else
	{
		$("#show20").removeClass('page_link');
		$("#show50").addClass('page_link');
	}
	$("#page_number").html(string_page);
	return ;
}


function DigitalRang(from,to,number)
{
	if(isNaN(from) ||isNaN(to) ||isNaN(number))
		return false
	if(from>to)
		return false
	if(from>=number&&number>=to)
		return false
	return true
}

function WebLoadString(CurSubMenu)
{
	try
	{
		$("#Search").val(WebString.Search);
		var ws = eval("X" + CurSubMenu + "String")
		for (var i =0; i < ws.length; i++)
		{
			$("#XS" + i).html(ws[i]);
		}
	}
	catch(error)
	{
	}
}

function setCookie(name,value)
{
     document.cookie = name + "="+ escape (value) 
	 location.replace(location) 

}

function getCookie(name) 
{ 
    var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
 
    if(arr=document.cookie.match(reg))
 
        return unescape(arr[2]); 
    else 
        return null; 
} 

function delCookie(name) 
{ 
    var exp = new Date(); 
    exp.setTime(exp.getTime() - 1); 
    var cval=getCookie(name); 
    if(cval!=null) 
        document.cookie= name + "="+cval+";expires="+exp.toGMTString(); 
} 

function logout()
{
	delCookie("Lgdomain")
	delCookie("username")
	delCookie("session_id")
	url = "/login.html";
	window.top.location.href = url;//*/
}
function getmenu()
{
	try
	{
		var cookie_user=getCookie('purview_user')

		if(cookie_user.substr(1,1)=='0'&&($("#page_title").val()=="management-network"||$("#page_title").val()=="management-networkconfig"))//management_network
		{	
				$("#ssid_apply_bttn").hide()
				$("#network_cancel_bttn").hide()
				$("#add_net_one_bttn").hide()
				$(".deleteNetwork").hide()
		}
		if(cookie_user.substr(2,1)=='0'&&($("#page_title").val()=="management-system"||$("#page_title").val()=="management-firmware"))//management_system
		{	
				$("#ssid_cancel_bttn").hide()
				$("#ssid_apply_bttn").hide()
				$("#subsection2").hide()
				$("#subsection3").hide()
				$("#apply_bttn").hide()
				$(".delete_purview").hide()
				
		}
		if(cookie_user.substr(3,1)=='0'&&($("#page_title").val()=="configure-overview" || $("#page_title").val()=="configure-device") )//configure device
		{	

				$("#add_divice").hide()
				$("#cancel_bttn_div").hide()
				$("#apply_bttn_div").hide()
				$("#hide_purview").hide()
				$("#device_ssid_add").hide()
				$("#device_delete_bttn").hide()
				$("#device_reboot_bttn").hide()
				$(".delete_purview").hide()
		}
		
		if(cookie_user.substr(3,1)=='0'&&($("#page_title").val()=="configure-ssid" || $("#page_title").val()=="configure-ssidsummary") )//configure device
		{	

				$("#addSsidButton").hide()
				$("#hide_purview").hide()
				$("#ssid_delete_bttn").hide()
				$("#ssid_apply_id").hide()
				
		}

	}
	catch(error)
	{
	}
	
}







/*
 * jQuery Progress Bar plugin
 * Version 1.1.0 (06/20/2008)
 * @requires jQuery v1.2.1 or later
 *
 * Copyright (c) 2008 Gary Teo
 * http://t.wits.sg

USAGE:
	$(".someclass").progressBar();
	$("#progressbar").progressBar();
	$("#progressbar").progressBar(45);							// percentage
	$("#progressbar").progressBar({showText: false });			// percentage with config
	$("#progressbar").progressBar(45, {showText: false });		// percentage with config
*/
(function($) {
	$.extend({
		progressBar: new function() {

			this.defaults = {
				increment	: 2,
				speed		: 15,
				showText	: true,											// show text with percentage in next to the progressbar? - default : true
				width		: 480,											// Width of the progressbar - don't forget to adjust your image too!!!
				boxImage	: 'static/images/box.png',						// boxImage : image around the progress bar
				barImage	: {
								0:	'static/images/green.png'
							},												// Image to use in the progressbar. Can be a single image too: 'images/progressbg_green.gif'
				height		: 12											// Height of the progressbar - don't forget to adjust your image too!!!
			};
			
			/* public methods */
			this.construct = function(arg1, arg2) {
				var argpercentage	= null;
				var argconfig		= null;
				
				if (arg1 != null) {
					if (!isNaN(arg1)) {
						argpercentage 	= arg1;
						if (arg2 != null) {
							argconfig	= arg2; }
					} else {
						argconfig		= arg1; 
					}
				}
				
				return this.each(function(child) {
					var pb		= this;
					if (argpercentage != null && this.bar != null && this.config != null) {
						this.config.tpercentage	= argpercentage;
						if (argconfig != null)
							pb.config			= $.extend(this.config, argconfig);
					} else {
						var $this				= $(this);
						var config				= $.extend({}, $.progressBar.defaults, argconfig);
						var percentage			= argpercentage;
						if (argpercentage == null)
							var percentage		= $this.html().replace("%","");	// parsed percentage
						
						
						$this.html("");
						var bar					= document.createElement('img');
						var text				= document.createElement('span');
						bar.id 					= this.id + "_percentImage";
						text.id 				= this.id + "_percentText";
						bar.title				= percentage + "%";
						bar.alt					= percentage + "%";
						bar.src					= config.boxImage;
						bar.width				= config.width;
						var $bar				= $(bar);
						var $text				= $(text);
						
						this.bar				= $bar;
						this.ntext				= $text;
						this.config				= config;
						this.config.cpercentage	= 0;
						this.config.tpercentage	= percentage;
						
						$bar.css("width", config.width + "px");
						$bar.css("height", config.height + "px");
						$bar.css("background-image", "url(" + getBarImage(this.config.cpercentage, config) + ")");
						$bar.css("padding", "0");
						$bar.css("margin", "0");
						$this.append($bar);
						$this.append($text);
					}
					
					function getBarImage (percentage, config) {
						var image = config.barImage;
						if (typeof(config.barImage) == 'object') {
							for (var i in config.barImage) {
								if (percentage >= parseInt(i)) {
									image = config.barImage[i];
								} else { break; }
							}
						}
						return image;
					}
					
					var t = setInterval(function() {
						var config		= pb.config;
						var cpercentage = parseInt(config.cpercentage);
						var tpercentage = parseInt(config.tpercentage);
						var increment	= parseInt(config.increment);
						var bar			= pb.bar;
						var text		= pb.ntext;
						var pixels		= config.width / 100;			// Define how many pixels go into 1%
						
						bar.css("background-image", "url(" + getBarImage(cpercentage, config) + ")");
						bar.css("background-position", (((config.width * -1)) + (cpercentage * pixels)) + 'px 50%');
						
						if (config.showText)
							text.html(" " + Math.round(cpercentage) + "%");
						
						if (cpercentage > tpercentage) {
							if (cpercentage - increment  < tpercentage) {
								pb.config.cpercentage = 0 + tpercentage
							} else {
								pb.config.cpercentage -= increment;
							}
						}
						else if (pb.config.cpercentage < pb.config.tpercentage) {
							if (cpercentage + increment  > tpercentage) {
								pb.config.cpercentage = tpercentage
							} else {
								pb.config.cpercentage += increment;
							}
						} 
						else {
							clearInterval(t);
						}
					}, pb.config.speed); 
				});
			};
		}
	});
		
	$.fn.extend({
        progressBar: $.progressBar.construct
	});
	
})(jQuery);