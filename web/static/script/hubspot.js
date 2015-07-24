var delayS=6*60*60*1000;
var ldate = new Date(new Date().getTime()-delayS);
var cdate = new Date(new Date().getTime()-delayS);
function trackUser(url,title,userToken){
    cdate = new Date(new Date().getTime()-delayS);
    var trackUrl="http://www.tanaza.com/tracking.php?";
    //userToken
    trackUrl+="g="+encodeURIComponent(userToken)+"&";
    //newUser
    trackUrl+="n=0&";
    trackUrl+="u="+encodeURIComponent(url)+"&";
    trackUrl+="r="+(document.referrer!=null?encodeURIComponent(document.referrer):"")+"&";
    trackUrl+="t="+encodeURIComponent(title)+"&";
    trackUrl+="p=149916&";
    trackUrl+="lvt="+encodeURIComponent(formatTimehs(ldate))+"&";
    trackUrl+="cvt="+encodeURIComponent(formatTimehs(cdate))+"&";
    $("#trackImage").attr("src",trackUrl);
    ldate=cdate;
}
function formatTimehs(date){
    return date.getFullYear()+"-"+(date.getMonth()<10?"0":"")+date.getMonth()+"-"+(date.getDay()<10?"0":""+date.getDay())+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
}