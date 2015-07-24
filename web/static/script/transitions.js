function updateLayout(newLayout) {
    switch (newLayout) {
        /** Content max */
        case 1:
            display[0]=false;
            display[1]=true;
            display[2]=false;
            $('#menuLevel3').css('opacity',0);
            $('#content').css('width',widths[0] + widths[1] + widths[2]);
            $('#contentInner').css('width',widths[0] + widths[1] + widths[2]);
            $('#content').css('left',0);
            $('#help').css('opacity',0);
            updateDisplay();
            break;
        /** 3 sections: 20% 55% 25% */
        case 2:
            display[0]=true;
            display[1]=true;
            display[2]=true;
            $("#menuLevel3").show();
            $("#help").show();
                
            $('#menuLevel3').css('opacity',1);
            $('#content').css('width',widths[1]);
            $('#contentInner').css('width',widths[1]);
            $('#content').css('left',widths[0]);
            $('#help').css('opacity',1);
            break;
        /** 2 sections: 20% 80% 0% */
        case 3:
            display[0]=true;
            display[1]=true;
            display[2]=false;
            $("#menuLevel3").show();
                
            $('#menuLevel3').css('opacity',1);
            $('#content').css('width',widths[1] + widths[2]);
            $('#contentInner').css('width',widths[1] + widths[2]);
            $('#content').css('left',widths[0]);
            $('#help').css('opacity',0);
            updateDisplay();
            break;
        /** 2 sections: 0% 75% 25% */
        case 4:
            display[0]=false;
            display[1]=true;
            display[2]=true;
            $("#help").show();
                
            $('#menuLevel3').css('opacity',0);
            $('#content').css('width',widths[0] + widths[1]);
            $('#contentInner').css('width',widths[0] + widths[1]);
            $('#content').css('left',0);
            $('#help').css('opacity',1);
            break;
    }
}
function updateExposeLayout(newLayout) {
    switch (newLayout) {
        /** Content max */
        case 1:
            displayExpose[0]=false;
            displayExpose[1]=true;
            displayExpose[2]=false;
                
            $('#exposeLeft').css('opacity',0);
            $('#exposeCenter').css('width',widths[0] + widths[1]);
            $('#exposeCenter').css('left',0);
            $('#exposeRight').css('opacity',0);
            updateDisplayExpose();
            break;
        /** 3 sections: 20% 55% 25% */
        case 2:
            displayExpose[0]=true;
            displayExpose[1]=true;
            displayExpose[2]=true;
                
            $('#exposeLeft').css('opacity',1);
            $('#exposeCenter').css('width',widths[1]);
            $('#exposeCenter').css('left',widths[0]);
            $('#exposeRight').css('opacity',1);
            updateDisplayExpose();
            break;
        /** 2 sections: 20% 80% 0% */
        case 3:
            displayExpose[0]=true;
            displayExpose[1]=true;
            displayExpose[2]=false;
                
            $('#exposeLeft').css('opacity',1);
            $('#exposeCenter').css('width',widths[1] + widths[2]);
            $('#exposeCenter').css('left',widths[0]);
            $('#exposeRight').css('opacity',0);
            updateDisplayExpose();
            break;
        /** 2 sections: 0% 75% 25% */
        case 4:
            displayExpose[0]=false;
            displayExpose[1]=true;
            displayExpose[2]=true;
                
            $('#exposeLeft').css('opacity',0);
            $('#exposeCenter').css('width',widths[0] + widths[1]);
            $('#exposeCenter').css('left',0);
            $('#exposeRight').css('opacity',1);
            updateDisplayExpose();
            break;
    }
}
function showSection(sectionid, html, hideLoaderAfter) {
    if(html!=null){
        $("#" + sectionid + "Inner").html(html);
    }
    $('#'+sectionid + "Inner").css('opacity',1);
    $('#'+sectionid + "Loader").css('opacity',0);
    $("#" + sectionid + "Loader").hide();

}
function showLoader(sectionid, showLoaderBefore) {
    if(jQuery("#appletLocation")){
        jQuery("#appletLocation").html("");
    }
    $("#" + sectionid + "Loader").show();
    $('#'+sectionid + "Inner").css('opacity',0);
    $('#'+sectionid + "Loader").css('opacity',1);
}
function updateMainSize() {
    var auto=false;
    var hContent = $("#contentInner").height();
    var hMenu = $("#menuLevel3Inner").height();
    var max=(hContent>hMenu?hContent:hMenu);
    if (hContent > 400 || hMenu>400) {
    $('#main').css('height', 'auto');
    $('#main').css('min-height', max);
    }
    else{
    $('#main').css('height', '400px');
    $('#main').css('min-height', max);
    }  
}