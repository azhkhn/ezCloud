var previousMain;
var previousSecondary;
var selected = null;
var subselected = null;
var prevTab="";
function showmenuLevel1() {
    document.getElementById("menuLevel1").style.display='block';
}
function showSecondaryMenu(mainSelection,secondarySelection,changePage) {
    //alert("showSecondaryMenu");
    if(mainSelection!=null){
        var elements=$(".section");
        for(var i=0;i<elements.length;i++){
            if(elements[i].id==('menuLevel1Selection'+mainSelection)){
                selected = mainSelection;				
                var elementtab = $("#tabs_"+mainSelection);
                $(elementtab[0]).addClass("current");
                for(var t=0; t<4; t++){
                    if(t != mainSelection) {
                        elementtab = $("#tabs_"+t);
                        $(elementtab[0]).removeClass("current");
                    }
                }
                var elementimg = $("#menuLevel1 .i_menu");
                for(var z=0;z<elementimg.length;z++){
                    var src = $(elementimg[z]).attr("src");
                    var str_split = src.split('/');
                    var img_split = str_split[str_split.length-1].split('_');

                    if(elementimg[z].id ==('menuLevel1Img'+mainSelection)) {
                        $(elementimg[z]).attr("src", "static/images/button/"+img_split[0]+"_img_og.png");
                    }
                    else{
                        $(elementimg[z]).attr("src", "static/images/button/"+img_split[0]+"_img_gr.png");
                    }
                }
                $("#secondaryMenu"+i+" .secondaryMenuContainer")[0].style.display='block';
                if(i != 0){
                    $("#secondaryMenu"+i+" .submenu")[0].style.display='block';
                }
                else{
                    $("#secondaryMenu"+i+" .submenu_none")[0].style.display='block';
                }
                if(secondarySelection!=null){
                    var subelements=$("#secondaryMenu"+i+" .secondarysection");
                    var subelementimg = $("#secondaryMenu"+i+" .i_submenu");
                    for(var j=0;j<subelements.length;j++){
                        if(subelements[j].id==('secondaryMenu'+i+'Selection'+secondarySelection)){

                            //assegnamento variabile selected dell'indice elemento current
                            subselected = secondarySelection;

                            elementtab = $("#secondaryMenu"+mainSelection+"Selection"+secondarySelection);
                            $(elementtab[0]).addClass("current","current");
                            for(var tt=0; tt<subelements.length; tt++){
                                if(subelements[tt].id!=('secondaryMenu'+mainSelection+'Selection'+secondarySelection)) {
                                    elementtab = subelements[tt];//$("#secondaryMenu"+mainSelection+"Selection"+t);
                                    $(elementtab).removeClass("current");
                                }
                            }
                            $(subelements[j]).addClass('secondarysectionSelected');
                            $(subelementimg[j]).attr("src", "static/images/button/arrow_gr.png"); 
                        }
                        else{
                            $(subelements[j]).removeClass('secondarysectionSelected');
                            $(subelementimg[j]).attr("src", "static/images/button/arrow_og.png"); 
                        }
                    }
                }
            }else{
                $(elements[i]).removeClass('sectionSelected');
                if($("#secondaryMenu"+i+" .secondaryMenuContainer")!=null && $("#secondaryMenu"+i+" .secondaryMenuContainer").length>0){
                    $("#secondaryMenu"+i+" .secondaryMenuContainer")[0].style.display='none';
                    if(i != 0){
                        $("#secondaryMenu"+i+" .submenu")[0].style.display='none';
                    }
                    else{
                        $("#secondaryMenu"+i+" .submenu_none")[0].style.display='none';
                    }
                }
				
            }
        }
    }
    document.getElementById("menuLevel1").style.display='block';
    if(!(changePage!=null && changePage==false)){
        //alert("mainSelection is "+mainSelection+" secondarySelection is "+secondarySelection);
        loadPage(mainSelection+"-"+secondarySelection);
    }
}

function changeMenu(mainSelection,secondarySelection,action) {
    if(mainSelection!=null){
        var elements=$(".section");
        for(var i=0;i<elements.length;i++){
            if(elements[i].id==('menuLevel1Selection'+mainSelection)){
                var elementimg = $(" .i_menu"); 
                for(var z=0;z<elementimg.length;z++){
                    var src = $(elementimg[z]).attr("src");
                    var str_split = src.split('/');
                    var img_split = str_split[str_split.length-1].split('_');
                    var ext_split = img_split[img_split.length-1].split('.');

                    if(elementimg[z].id ==('menuLevel1Img'+mainSelection)) {
                        if(action == 'over'){
                            $(elementimg[z]).attr("src", "static/images/button/"+img_split[0]+"_img_og.png");
                        }else{
                            if(selected != mainSelection){
                                $(elementimg[z]).attr("src", "static/images/button/"+img_split[0]+"_img_gr.png");
                            }
                        }
                    }
                }
            } 
        }
    }
}

function changeSubMenu(mainSelection,secondarySelection,action) {
    if(secondarySelection!=null) {
        var subelements=$("#secondaryMenu"+mainSelection+" .secondarysection");
        var subelementimg = $("#secondaryMenu"+mainSelection+" .i_submenu");
        for(var j=0;j<subelements.length;j++) {
            if(subelements[j].id==('secondaryMenu'+mainSelection+'Selection'+secondarySelection)) 
                if(action == 'over')
                    $(subelementimg[j]).attr("src", "static/images/button/arrow_gr.png");
                else
                if(subselected != secondarySelection)
                    $(subelementimg[j]).attr("src", "static/images/button/arrow_og.png");
        }
    }
}
var currentSubsection=0;
function showSubSection(index_tab,div_name) {
    var elements = $(".subsection");
    for(var t=0; t<elements.length; t++) {
        if(elements[t].id!=('subsection'+index_tab)) {
            $(elements[t]).removeClass("tabclick");
            $(elements[t]).removeClass("tabhover");
            $(elements[t]).addClass("tabdefault");
        }
    }
    for(var i=0;i<elements.length;i++){
        if(elements[i].id==('subsection'+index_tab)){
            $(elements[i]).removeClass("tabdefault");
            $(elements[i]).addClass("tabclick");
            
            
            var div = $('#'+div_name);
            $(div[0]).removeClass("tabs_hide");
            var divs = $(".ap_content");
            for(var z=0;z<divs.length;z++) {
                if(divs[z].id != div_name)
                    $(divs[z]).addClass("tabs_hide");
            }
        }
    }
	
    if(div_name == 'vlan') {
        if(typeof($("#"+div_name+" #table_alternate >thead tr").css("background-color")) != "undefined")
            $("#"+div_name+" #table_alternate").tableScroll({
                height:123
            });
    }
    else {
        if(div_name == 'radius') {
            if(typeof($("#t_first #table_alternate >thead tr").css("background-color")) != "undefined")
                $("#t_first #table_alternate").tableScroll({
                    height:92
                });
        }
        else {
        /*if(typeof($("#"+div_name+" #table_alternate >thead tr").css("background-color")) != "undefined")
				$("#"+div_name+" #table_alternate").tableScroll({height:92});*/
        }
    }
    if(div_name == 'control' || div_name=='associated_aps' || div_name=='snmp' || div_name=='internet' || div_name=='wireless_security' || div_name=='summary' || div_name=='advanced'){
        prevTab=div_name;
        updateMainSize();
    }
    else{
        if(prevTab=="control" || prevTab=='associated_aps'|| prevTab=='snmp' || prevTab=='internet' || prevTab=='advanced'){
            updateMainSize();
        }
    }
    //trigger internet connection update
    if(div_name=='internet'){
        dd_generateInternetTable();
    }
    prevTab=div_name;
}

function switchToAccountMenu(){
    var accountMenu=$("#placeholederMenu").html();
    
    var elements=$("#menuLevel1Container .section");
    for(var i=0;i<elements.length;i++){
        elements[i].style.display='none';
    }
    elements=$(".submenu");
    for(i=0;i<elements.length;i++){
        elements[i].style.display='none';
    }
    
    $(".submenu_none").show();
    $("#menuLevel1Container .menuLevel_1").html(accountMenu);
    $("#titleText").html('');
    $("#searchDiv").hide();
}

function selectMenuLeftStep(current){
    var elements=$(".menuLeftStep");
    for(var i=0;i<elements.length;i++){
        if($(elements[i]).attr("id")=="menuLeftStep"+current){
            if($(elements[i]).children().filter("table").length==1){
                var content=$(elements[i]).children().filter("table").parent().html();
                $(elements[i]).children().filter("table").remove();
                $(elements[i]).prepend("<a href=\"#\" style=\"text-decoration:none\" class=\"menuLeftSelectedStep\">"+content+"</a>");
                $(elements[i]).addClass("tzui-state-default");
                $(elements[i]).addClass("tzui-tabs-selected");
                $(elements[i]).addClass("tzui-state-active");
            }  
        }
        else{
            if($(elements[i]).children().filter("a").length==1){
                var content2=$(elements[i]).children().filter("a").html();
                $(elements[i]).removeClass("tzui-state-default");
                $(elements[i]).removeClass("tzui-tabs-selected");
                $(elements[i]).removeClass("tzui-state-active");
                $(elements[i]).children().filter("a").remove();
                $(elements[i]).prepend(content2);
            }
        }

        if(parseInt($(elements[i]).attr("id").charAt($(elements[i]).attr("id").length-1))<current){
            //previous
            $($($(elements[i]).find("tr").find("td")[1]).find("img")[0]).attr("src","static/images/list-check.png");
            $($(elements[i]).find("tr").find("td")[2]).attr("class","elementCheck");
        }else{
            if(parseInt($(elements[i]).attr("id").charAt($(elements[i]).attr("id").length-1))>current){
                //after
                $($($(elements[i]).find("tr").find("td")[1]).find("img")[0]).attr("src","static/images/list-gray.png");
                $($(elements[i]).find("tr").find("td")[2]).attr("class","element");
            }else{
                //current
                $($($(elements[i]).find("tr").find("td")[1]).find("img")[0]).attr("src","static/images/list-black.png");
                $($(elements[i]).find("tr").find("td")[2]).attr("class","elementCurrent");
            }
        }

    }
}


function now_network_name(url)
{
	url = url+"?network=" + $('#network_sel option:selected').val();
	window.top.location.href = url;
}