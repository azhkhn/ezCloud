/**
 *Tanaza 
 *Based on JQueryTools
 *
 *
 */
(function(a) { 	

	// static constructs
	a.tanaza = a.tanaza || {version: '@VERSION'};
	
	var tool;
	
	tool = a.tanaza.expose = {
		
		conf: {	
			maskId: 'exposeMask',
			loadSpeed: 'slow',
			closeSpeed: 'fast',
			closeOnClick: false,
			closeOnEsc: false,
			
			// css settings
			zIndex: 9998,
			opacity: 0.8,
			startOpacity: 0,
			color: '#fff',
			
			// callbacks
			onLoad: null,
			onClose: null
		}
	};

	/* one of the greatest headaches in the tool. finally made it */
	function viewport() {
				
		// the horror case
		if (a.browser.msie) {
			
			// if there are no scrollbars then use window.height
			var d = a(document).height(), w = a(window).height();
			
			return [
				window.innerWidth || 							// ie7+
				document.documentElement.clientWidth || 	// ie6  
				document.body.clientWidth, 					// ie6 quirks mode
				d - w < 20 ? w : d
			];
		} 
		
		// other well behaving browsers
		return [a(document).width(), a(document).height()]; 
	} 
	
	function call(fn) {
		if (fn) {return fn.call(a.mask);}
	}
	
	var mask, exposed, loaded, config, overlayIndex;		
	
	
	a.mask = {
		
		load: function(conf, els) {
			
			// already loaded ?
			if (loaded) {return this;}			
			
			// configuration
			if (typeof conf == 'string') {
				conf = {color: conf};	
			}
			
			// use latest config
			conf = conf || config;
			
			config = conf = a.extend(a.extend({}, tool.conf), conf);

			// get the mask
			mask = a("#" + conf.maskId);
				
			// or create it
			if (!mask.length) {
				mask = a('<div/>').attr("id", conf.maskId);
				a("body").append(mask);
			}
			
			// set position and dimensions 			
			var size = viewport();
				
			mask.css({				
				position:'absolute', 
				top: 0, 
				left: 0,
				width: size[0],
				height: size[1],
				display: 'none',
				opacity: conf.startOpacity,					 		
				zIndex: conf.zIndex 
			});
			
			if (conf.color) {
				mask.css("backgroundColor", conf.color);	
			}			
			
			// onBeforeLoad
			if (call(conf.onBeforeLoad) === false) {
				return this;
			}
			
			// esc button
			if (conf.closeOnEsc) {						
				a(document).on("keydown.mask", function(e) {							
					if (e.keyCode == 27) {
						a.mask.close(e);	
					}		
				});			
			}
			
			// mask click closes
			if (conf.closeOnClick) {
				mask.on("click.mask", function(e)  {
					a.mask.close(e);		
				});				
			}			
			
			// resize mask when window is resized
			a(window).on("resize.mask", function() {
				a.mask.fit();
			});
			
			// exposed elements
			if (els && els.length) {
				
				overlayIndex = els.eq(0).css("zIndex");

				// make sure element is positioned absolutely or relatively
				a.each(els, function() {
					var el = a(this);
					if (!/relative|absolute|fixed/i.test(el.css("position"))) {
						el.css("position", "relative");		
					}					
				});
			 
				// make elements sit on top of the mask
				exposed = els.css({zIndex: Math.max(conf.zIndex + 1, overlayIndex == 'auto' ? 0 : overlayIndex)});			
			}	
			
			// reveal mask
			mask.css({display: 'block'}).fadeTo(conf.loadSpeed, conf.opacity, function() {
				a.mask.fit(); 
				call(conf.onLoad);
				loaded = "full";
			});
			
			loaded = true;			
			return this;				
		},
		
		close: function() {
                        console.log("a.mask.close");
			if (loaded) {
				
				// onBeforeClose
				if (call(config.onBeforeClose) === false) {return this;}
					
				mask.fadeOut(config.closeSpeed, function()  {					
					call(config.onClose);					
					if (exposed) {
						exposed.css({zIndex: overlayIndex});						
					}				
					loaded = false;
				});				
				
				// unbind various event listeners
				a(document).off("keydown.mask");
				mask.off("click.mask");
				a(window).off("resize.mask");  
			}
			
			return this; 
		},
		
		fit: function() {
			if (loaded) {
				var size = viewport();				
				mask.css({width: size[0], height: size[1]});
			}				
		},
		
		getMask: function() {
			return mask;	
		},
		
		isLoaded: function(fully) {
			return fully ? loaded == 'full' : loaded;	
		}, 
		
		getConf: function() {
			return config;	
		},
		
		getExposed: function() {
			return exposed;	
		}		
	};
	
	a.fn.mask = function(conf) {
                console.log("a.fn.mask");
		a.mask.load(conf);
		return this;		
	};			
	
	a.fn.expose = function(conf) {
                console.log("a.fn.expose");
		a.mask.load(conf, this);
		return this;			
	};


})(jQuery);
