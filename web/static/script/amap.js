/*
  ----------------AMap common API--------------- 
  Create by gongyanhong@2015.6.11
*/

	var initlng = 116.327911;
	var initlat = 39.939229;
	var initzoom = 16;

/*-------------------------自定义信息窗体 API-------------------------*/	
	//构建自定义信息窗体	
	function createInfoWindow(title,content){
		var info = document.createElement("div");
		info.className = "info";
	
		//可以通过下面的方式修改自定义窗体的宽高
		info.style.width = "300px";
	
		// 定义顶部标题
		var top = document.createElement("div");
		var titleD = document.createElement("div");
		var closeX = document.createElement("img");
		top.className = "info-top"; 
		titleD.innerHTML = title; 
		closeX.src = "http://webapi.amap.com/images/close2.gif";
		closeX.onclick = closeInfoWindow;
		  
		top.appendChild(titleD);
		top.appendChild(closeX);
		info.appendChild(top);
		
	    
		// 定义中部内容
		var middle = document.createElement("div");
		middle.className = "info-middle";
		middle.style.backgroundColor='white';
		middle.innerHTML = content;
		info.appendChild(middle);
		
		// 定义底部内容
		var bottom = document.createElement("div");
		bottom.className = "info-bottom";
		bottom.style.position = 'relative';
		bottom.style.top = '0px';
		bottom.style.margin = '0 auto';
		var sharp = document.createElement("img");
		sharp.src = "http://webapi.amap.com/images/sharp.png";
		bottom.appendChild(sharp);	
		info.appendChild(bottom);
		return info;
	}
	
	//关闭信息窗体
	function closeInfoWindow(){
		mapObj.clearInfoWindow();
	}
	
	/*-------------------------Map marker API-------------------------*/	
	function onClickMarker()
	{
		var vendor = "", sn = "", mac = ""; 
		var devname = this.getTitle();
		$.each(nwdevices,function(wid,wel){
			if(wel.dev_name == devname)
			{
				vendor = wel.dev_vendor;;
				sn = wel.dev_sn;
				mac = wel.dev_mac;
				return false;
			}
		})	
		//实例化信息窗体
		var infoWindow = new AMap.InfoWindow({
			isCustom:true,  //使用自定义窗体
			content:createInfoWindow('<span style="font-size:10px;color:#4382B4">Device Name: ' + this.getTitle() +'</span>',"<img src='static/images/ap/ap_model.png' style='position:relative;float:left;margin:0 5px 5px 0;'>Device Vendor: " + vendor + "<br/>Device MAC: " + mac + "<br/>Device SN: " + sn),
			offset:new AMap.Pixel(16, -45)//-113, -140
		});	
		infoWindow.open(mapObj, this.getPosition());
	}
	
	function displaySelectDeviceMap(idx, imgname, devname)
	{
		var longitude = marker[idx].getPosition().lng;
		var latitude = marker[idx].getPosition().lat;
		
		marker[idx].setMap(null);
		marker[idx] = new AMap.Marker({
			icon: new AMap.Icon({
				size:new AMap.Size(32,32),  
				image:"static/images/ap/" + imgname
			}),
			position:new AMap.LngLat(longitude, latitude),
		});
		
		marker[idx].setMap(mapObj);
		marker[idx].setTitle(devname); 
		AMap.event.addListener(marker[idx],'click',onClickMarker);
	}
	
	function overDevice(row, dev_name)
	{
		if( row < marker.length )
		{
			displaySelectDeviceMap(row, "curap.png", dev_name);	
			$("#map_save").hide();
		}
	}
	
	function outDevice(row, dev_name)
	{
		if( row < marker.length )
		{
			displaySelectDeviceMap(row, "ap180.png", dev_name);	
			$("#map_save").hide();
		}
	}	
	
	/*-------------------------Map Create API-------------------------*/
	function MapInit(longitude, latitude, zoomlevel)
	{
		mapObj = new AMap.Map("mapContainer", {
			resizeEnable: true,
			scrollWhell: true,
			doubleClickZoom: true,
			view: new AMap.View2D({
				resizeEnable: true,
				center:new AMap.LngLat(longitude, latitude),//地图中心点
				zoom:zoomlevel//地图显示的缩放级别
			}),
			keyboardEnable:false
		});
	}
	
	function fillStoreySelect()
	{
		$("#floor_select").empty();
	
		for (var i = 0; i < nwmaps.length; i++)
		{
			$("#floor_select").append("<option value=" + nwmaps[i].floor_id + ">" + nwmaps[i].floor_id + "<\/option>");
		}
	}
	
	function LoadFloorIdMap()
	{
		var idx = 0;
		var floor_id = $("#floor_select").val();
		for(var i = 0; i < nwmaps.length; i++)
		{
			if( floor_id == nwmaps[i].floor_id ) 
			{
				idx = i;
				break;
			}
		}
		imageLayer = new AMap.ImageLayer({	
			url:"static/images/maps/" + nwmaps[idx].map_image,
			bounds: new AMap.Bounds( //经纬度边界
			new AMap.LngLat(nwmaps[idx].longitude - 0.014748, nwmaps[idx].latitude - 0.007046),
			new AMap.LngLat(nwmaps[idx].longitude + 0.014748, nwmaps[idx].latitude + 0.007046)),
			//可见zoom范围
			zooms: [14, 18] 
		})
		
		mapObj = new AMap.Map("mapContainer", {
			resizeEnable: false,
			layers:[
				new AMap.TileLayer(),
				imageLayer
			],
			view: new AMap.View2D({
				resizeEnable: true,
				center:new AMap.LngLat(nwmaps[idx].longitude, nwmaps[idx].latitude),//地图中心点
				zoom:nwmaps[idx].zoomlevel//地图显示的缩放级别
			}),
			keyboardEnable:false
		});	
	}
	
	
		/*-------------------------Network Map API-------------------------*/
		function addMapCompleteListener()
		{
			var center = mapObj.getCenter();
			$("#longitude").val(center.lng);
			$("#latitude").val(center.lat); 
			$("#zoomlevel").val(this.getZoom()); 
		}
		
		function addMapZoomchangeListener()
		{
			$("#zoomlevel").val(this.getZoom()); 
		}
		
		function addMapDragendListener()
		{
			var center = mapObj.getCenter();
			$("#longitude").val(center.lng);
			$("#latitude").val(center.lat); 
		}

		//输入提示
		function autoSearch() {
		    var keywords = document.getElementById("keyword").value;
		    var auto;
		    //加载输入提示插件
		        AMap.service(["AMap.Autocomplete"], function() {
		        var autoOptions = {
		            city: "" //城市，默认全国
		        };
		        auto = new AMap.Autocomplete(autoOptions);
		        //查询成功时返回查询结果
		        if ( keywords.length > 0) {
		            auto.search(keywords, function(status, result){
		            	autocomplete_CallBack(result);
		            });
		        }
		        else {
		            document.getElementById("result1").style.display = "none";
		        }
		    });
		}
		 
		//输出输入提示结果的回调函数
		function autocomplete_CallBack(data) {
		    var resultStr = "";
		    var tipArr = data.tips;
		    if (tipArr&&tipArr.length>0) {                 
		        for (var i = 0; i < tipArr.length; i++) {
		            resultStr += "<div id='divid" + (i + 1) + "' onmouseover='openMarkerTipById(" + (i + 1)
		                        + ",this)' onclick='selectResult(" + i + ")' onmouseout='onmouseout_MarkerStyle(" + (i + 1)
		                        + ",this)' style=\"font-size: 13px;cursor:pointer;padding:5px 5px 5px 5px;\"" + "data=" + tipArr[i].adcode + ">" + tipArr[i].name + "<span style='color:#C1C1C1;'>"+ tipArr[i].district + "</span></div>";
		        }
		    }
		    else  {
		        resultStr = "没有匹配结果!<br />1.请确实该地名存在<br />2.试试不同的关键字<br />3.尝试更宽泛的地域名";
		    }
		    document.getElementById("result1").curSelect = -1;
		    document.getElementById("result1").tipArr = tipArr;
		    document.getElementById("result1").innerHTML = resultStr;
		    document.getElementById("result1").style.display = "block";
		}
		 
		//输入提示框鼠标滑过时的样式
		function openMarkerTipById(pointid, thiss) {  //根据id打开搜索结果点tip 
		    thiss.style.background = '#CAE1FF';
		}
		 
		//输入提示框鼠标移出时的样式
		function onmouseout_MarkerStyle(pointid, thiss) {  //鼠标移开后点样式恢复 
		    thiss.style.background = "";
		}
		 
		//从输入提示框中选择关键字并查询
		function selectResult(index) {
		    if(index<0){
		        return;
		    }
		    if (navigator.userAgent.indexOf("MSIE") > 0) {
		        document.getElementById("keyword").onpropertychange = null;
		        document.getElementById("keyword").onfocus = focus_callback;
		    }
		    //截取输入提示的关键字部分
		    var text = document.getElementById("divid" + (index + 1)).innerHTML.replace(/<[^>].*?>.*<\/[^>].*?>/g,"");
			var cityCode = document.getElementById("divid" + (index + 1)).getAttribute('data');
		    document.getElementById("keyword").value = text;
		    document.getElementById("result1").style.display = "none";
		    //根据选择的输入提示关键字查询
		    mapObj.plugin(["AMap.PlaceSearch"], function() {       
		        var msearch = new AMap.PlaceSearch();  //构造地点查询类
		        AMap.event.addListener(msearch, "complete", placeSearch_CallBack); //查询成功时的回调函数
				msearch.setCity(cityCode);
		        msearch.search(text);  //关键字查询查询
		    });
		}
		 
		//定位选择输入提示关键字
		function focus_callback() {
		    if (navigator.userAgent.indexOf("MSIE") > 0) {
		        document.getElementById("keyword").onpropertychange = autoSearch;
		   }
		}
		 
		//输出关键字查询结果的回调函数
		function placeSearch_CallBack(data) {
		    //清空地图上的InfoWindow和Marker
		    windowsArr = [];
		    marker     = [];
		    mapObj.clearMap();
		    var resultStr1 = "";
		    var poiArr = data.poiList.pois;
		    var resultCount = poiArr.length;
		    for (var i = 0; i < resultCount; i++) {
		        resultStr1 += "<div id='divid" + (i + 1) + "' onmouseover='openMarkerTipById1(" + i + ",this)' onmouseout='onmouseout_MarkerStyle(" + (i + 1) + ",this)' style=\"font-size: 12px;cursor:pointer;padding:0px 0 4px 2px; border-bottom:1px solid #C1FFC1;\"><table><tr><td><img src=\"http://webapi.amap.com/images/" + (i + 1) + ".png\"></td>" + "<td><h3><font color=\"#00a6ac\">名称: " + poiArr[i].name + "</font></h3>";
		            resultStr1 += TipContents(poiArr[i].type, poiArr[i].address, poiArr[i].tel) + "</td></tr></table></div>";
		            addmarker(i, poiArr[i]);
		    }
		    mapObj.setFitView();
		    var center = mapObj.getCenter();
				$("#longitude").val(center.lng);
				$("#latitude").val(center.lat);
		}
		 
		//鼠标滑过查询结果改变背景样式，根据id打开信息窗体
		function openMarkerTipById1(pointid, thiss) {
		    this.style.background = '#CAE1FF';
		    windowsArr[pointid].open(mapObj, marker[pointid]);
		}
		 
		//添加查询结果的marker&infowindow   
		function addmarker(i, d) {
		    var lngX = d.location.getLng();
		    var latY = d.location.getLat();
		    var markerOption = {
		        map:mapObj,
		        icon:"http://webapi.amap.com/images/" + (i + 1) + ".png",
		        position:new AMap.LngLat(lngX, latY)
		    };
		    var mar = new AMap.Marker(markerOption);         
		    marker.push(new AMap.LngLat(lngX, latY));
		 
		    var infoWindow = new AMap.InfoWindow({
		        content:"<h3><font color=\"#00a6ac\">  " + (i + 1) + ". " + d.name + "</font></h3>" + TipContents(d.type, d.address, d.tel),
		        size:new AMap.Size(300, 0),
		        autoMove:true, 
		        offset:new AMap.Pixel(0,-30)
		    });
		    windowsArr.push(infoWindow);
		    var aa = function (e) {infoWindow.open(mapObj, mar.getPosition());};
		    AMap.event.addListener(mar, "mouseover", aa);
		}
		 
		//infowindow显示内容
		function TipContents(type, address, tel) {  //窗体内容
		    if (type == "" || type == "undefined" || type == null || type == " undefined" || typeof type == "undefined") {
		        type = "暂无";
		    }
		    if (address == "" || address == "undefined" || address == null || address == " undefined" || typeof address == "undefined") {
		        address = "暂无";
		    }
		    if (tel == "" || tel == "undefined" || tel == null || tel == " undefined" || typeof address == "tel") {
		        tel = "暂无";
		    }
		    var str = "  地址：" + address + "<br />  电话：" + tel + " <br />  类型：" + type;
		    return str;
		}
		function keydown(event){
		    var key = (event||window.event).keyCode;
		    var result = document.getElementById("result1")
		    var cur = result.curSelect;
		    if(key===40){//down
		        if(cur + 1 < result.childNodes.length){
		            if(result.childNodes[cur]){
		                result.childNodes[cur].style.background='';
		            }
		            result.curSelect=cur+1;
		            result.childNodes[cur+1].style.background='#CAE1FF';
		            document.getElementById("keyword").value = result.tipArr[cur+1].name;
		        }
		    }else if(key===38){//up
		        if(cur-1>=0){
		            if(result.childNodes[cur]){
		                result.childNodes[cur].style.background='';
		            }
		            result.curSelect=cur-1;
		            result.childNodes[cur-1].style.background='#CAE1FF';
		            document.getElementById("keyword").value = result.tipArr[cur-1].name;
		        }
		    }else if(key === 13){
		        var res = document.getElementById("result1");
				if(res && res['curSelect'] !== -1){
					selectResult(document.getElementById("result1").curSelect);
				}
		    }else{
		        autoSearch();
		    }
		}