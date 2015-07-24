/*!
 * jQuery Tools v1.2.7 - The missing UI library for the Web
 * 
 * overlay/overlay.js
 * overlay/overlay.apple.js
 * toolbox/toolbox.expose.js
 * 
 * Based on jquery 1.7.2 , also ok for jquery 1.10.1 for tooltip using jquery ui defined height and width
 * ATTENTION ON : outerWidth to substitute with oldOuterWidth
 *                outerHeight to substitute with oldOuterWidth
 * 
 **/
(function(a) { 

	// static constructs
	a.tanaza = a.tanaza || {version: '@VERSION'};
	
	a.tanaza.overlay = {
		
		addEffect: function(name, loadFn, closeFn) {
			effects[name] = [loadFn, closeFn];	
		},
	
		conf: {  
			close: null,	
			closeOnClick: false,
			closeOnEsc: false,			
			closeSpeed: 'fast',
			effect: 'default',
			
			// since 1.2. fixed positioning not supported by IE6
			fixed: !a.browser.msie || a.browser.version > 6, 
			
			left: 'center',		
			load: false, // 1.2
			mask: null,  
			oneInstance: true,
			speed: 'normal',
			target: null, // target element to be overlayed. by default taken from [rel]
			top: '10%'
		}
	};

	
	var instances = [], effects = {};
		
	// the default effect. nice and easy!
	a.tanaza.overlay.addEffect('default', 
		
		/* 
			onLoad/onClose functions must be called otherwise none of the 
			user supplied callback methods won't be called
		*/
		function(pos, onLoad) {
			
			var conf = this.getConf(),
				 w = a(window);				 
				
			if (!conf.fixed)  {
				pos.top += w.scrollTop();
				pos.left += w.scrollLeft();
			} 
				
			pos.position = conf.fixed ? 'fixed' : 'absolute';
			this.getOverlay().css(pos).fadeIn(conf.speed, onLoad); 
			
		}, function(onClose) {
			this.getOverlay().fadeOut(this.getConf().closeSpeed, onClose); 			
		}		
	);		

	
	function Overlay(trigger, conf) {		
		
		// private variables
		var self = this,
			 fire = trigger.add(self),
			 w = a(window), 
			 closers,            
			 overlay,
			 opened,
			 maskConf = a.tanaza.expose && (conf.mask || conf.expose),
			 uid = Math.random().toString().slice(10);		
		
			 
		// mask configuration
		if (maskConf) {			
			if (typeof maskConf == 'string') {maskConf = {color: maskConf};
			maskConf.closeOnClick = maskConf.closeOnEsc = false;
		}			 
		 
		// get overlay and trigger
		var jq = conf.target || trigger.attr("rel");
		overlay = jq ? a(jq) : null || trigger;	
		
		// overlay not found. cannot continue
		if (!overlay.length) {throw "Could not find Overlay: " + jq;}
		
		// trigger's click event
		if (trigger && trigger.index(overlay) == -1) {
			trigger.click(function(e) {				
				self.load(e);
				return e.preventDefault();
			});
		}   			
		
		// API methods  
		a.extend(self, {

			load: function(e) {
				
				// can be opened only once
				if (self.isOpened()) {return self;}
				
				// find the effect
		 		var eff = effects[conf.effect];
		 		if (!eff) {throw "Overlay: cannot find effect : \"" + conf.effect + "\"";}
				
				// close other instances?
				if (conf.oneInstance) {
					a.each(instances, function() {
						this.close(e);
					});
				}
				
				// onBeforeLoad
				e = e || a.Event();
				e.type = "onBeforeLoad";
				fire.trigger(e);				
				if (e.isDefaultPrevented()) {return self;}				

				// opened
				opened = true;
				
				// possible mask effect
				if (maskConf) {a(overlay).expose(maskConf);}				
				
				// position & dimensions 
				var top = conf.top,					
					 left = conf.left,
					 oWidth = oldOuterWidth(overlay),
					 oHeight = oldOuterHeight(overlay);
                                         /*oWidth = overlay.outerWidth({margin:true}),
					 oHeight = overlay.outerHeight({margin:true}); */
				
				if (typeof top == 'string')  {
					top = top == 'center' ? Math.max((w.height() - oHeight) / 2, 0) : 
						parseInt(top, 10) / 100 * w.height();			
				}				
				
				if (left == 'center') {left = Math.max((w.width() - oWidth) / 2, 0);}

				
		 		// load effect  		 		
				eff[0].call(self, {top: top, left: left}, function() {					
					if (opened) {
						e.type = "onLoad";
						fire.trigger(e);
					}
				}); 				

				// mask.click closes overlay
				if (maskConf && conf.closeOnClick) {
					a.mask.getMask().one("click", self.close); 
				}
				
				// when window is clicked outside overlay, we close
				if (conf.closeOnClick) {
					a(document).on("click." + uid, function(e) { 
						if (!a(e.target).parents(overlay).length) { 
							self.close(e); 
						}
					});						
				}						
			
				// keyboard::escape
				if (conf.closeOnEsc) { 

					// one callback is enough if multiple instances are loaded simultaneously
					a(document).on("keydown." + uid, function(e) {
						if (e.keyCode == 27) { 
							self.close(e);	 
						}
					});			
				}

				
				return self; 
			}, 
			
			close: function(e) {
                                if (!self.isOpened()) {return self;}
				
				e = e || a.Event();
				e.type = "onBeforeClose";
				fire.trigger(e);				
				if (e.isDefaultPrevented()) {return;}				
				
				opened = false;
				
				// close effect
				effects[conf.effect][1].call(self, function() {
					e.type = "onClose";
					fire.trigger(e); 
				});
				
				// unbind the keyboard / clicking actions
				a(document).off("click." + uid + " keydown." + uid);		  
				
				if (maskConf) {
					a.mask.close();		
				}
				 
				return self;
			}, 
			
			getOverlay: function() {
				return overlay;	
			},
			
			getTrigger: function() {
				return trigger;	
			},
			
			getClosers: function() {
				return closers;	
			},			

			isOpened: function()  {
				return opened;
			},
			
			// manipulate start, finish and speeds
			getConf: function() {
				return conf;	
			}			
			
		});
		
		// callbacks	
		a.each("onBeforeLoad,onStart,onLoad,onBeforeClose,onClose".split(","), function(i, name) {
				
			// configuration
			if (a.isFunction(conf[name])) { 
				a(self).on(name, conf[name]); 
			}

			// API
			self[name] = function(fn) {
				if (fn) {a(self).on(name, fn);}
				return self;
			};
		});
		
		// close button
		closers = overlay.find(conf.close || ".close");		
		
		if (!closers.length && !conf.close) {
			closers = a('<a class="close"></a>');
			overlay.prepend(closers);	
		}		
		
		closers.click(function(e) { 
			self.close(e);  
		});	
		
		// autoload
		if (conf.load) {
                    self.load();
                }
            }
		
	}
	
	// jQuery plugin initialization
	a.fn.overlay = function(conf) {   
		
		// already constructed --> return API
		var el = this.data("overlay");
		if (el) {return el;}	  		 
		
		if (a.isFunction(conf)) {
			conf = {onBeforeLoad: conf};	
		}

		conf = a.extend(true, {}, a.tanaza.overlay.conf, conf);
		
		this.each(function() {		
			el = new Overlay(a(this), conf);
			instances.push(el);
			a(this).data("overlay", el);	
		});
		
		return conf.api ? el: this;		
	}; 
	
})(jQuery);

/**
 * @license 
 * jQuery Tools @VERSION / Overlay Apple effect. 
 * 
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 * 
 * http://flowplayer.org/tanaza/overlay/apple.html
 *
 * Since: July 2009
 * Date: @DATE 
 */
(function(a) { 

	// version number
	var t = a.tanaza.overlay,
		 w = a(window); 
		
	// extend global configuragion with effect specific defaults
	a.extend(t.conf, { 
		start: { 
			top: null,
			left: null
		},
		
		fadeInSpeed: 'fast',
		zIndex: 9999
	});			
	
	// utility function
	function getPosition(el) {
		var p = el.offset();
		return {
			top: p.top + el.height() / 2, 
			left: p.left + el.width() / 2
		}; 
	}
	
//{{{ load 

	var loadEffect = function(pos, onLoad) {
		
		var overlay = this.getOverlay(),
			 conf = this.getConf(),
			 trigger = this.getTrigger(),
			 self = this,
			 oWidth = overlay.outerWidth({margin:true}),
			 img = overlay.data("img"),
			 position = conf.fixed ? 'fixed' : 'absolute';  
		
		
		// growing image is required.
		if (!img) { 
			var bg = overlay.css("backgroundImage");
			
			if (!bg) { 
				throw "background-image CSS property not set for overlay"; 
			}
			
			// url("bg.jpg") --> bg.jpg
			bg = bg.slice(bg.indexOf("(") + 1, bg.indexOf(")")).replace(/\"/g, "");
			overlay.css("backgroundImage", "none");
			
			img = a('<img src="' + bg + '"/>');
			img.css({border:0, display:'none'}).width(oWidth);			
			a('body').append(img); 
			overlay.data("img", img);
		}
		
		// initial top & left
		var itop = conf.start.top || Math.round(w.height() / 2), 
			 ileft = conf.start.left || Math.round(w.width() / 2);
		
		if (trigger) {
			var p = getPosition(trigger);
			itop = p.top;
			ileft = p.left;
		} 
		
		// put overlay into final position
		if (conf.fixed) {
			itop -= w.scrollTop();
			ileft -= w.scrollLeft();
		} else {
			pos.top += w.scrollTop();
			pos.left += w.scrollLeft();				
		}
			
		// initialize background image and make it visible
		img.css({
			position: 'absolute',
			top: itop, 
			left: ileft,
			width: 0,
			zIndex: conf.zIndex
		}).show();
		
		pos.position = position;
		overlay.css(pos);
		
		// begin growing
		img.animate({			
			top: pos.top,
			left: pos.left,
			width: oWidth}, conf.speed, function() {
			
			// set close button and content over the image
			overlay.css("zIndex", conf.zIndex + 1).fadeIn(conf.fadeInSpeed, function()  { 
					
				if (self.isOpened() && !a(this).index(overlay)) {	
					onLoad.call(); 
				} else {
					overlay.hide();	
				} 
			});
			
		}).css("position", position);
		
	};
//}}}
	
	
	var closeEffect = function(onClose) {

		// variables
		var overlay = this.getOverlay().hide(), 
			 conf = this.getConf(),
			 trigger = this.getTrigger(),
			 img = overlay.data("img"),
			 
			 css = { 
			 	top: conf.start.top, 
			 	left: conf.start.left, 
			 	width: 0 
			 };
		
		// trigger position
		if (trigger) {a.extend(css, getPosition(trigger));}
		
		
		// change from fixed to absolute position
		if (conf.fixed) {
			img.css({position: 'absolute'})
				.animate({top: "+=" + w.scrollTop(), left: "+=" + w.scrollLeft()}, 0);
		}
		 
		// shrink image		
		img.animate(css, conf.closeSpeed, onClose);	
	};
	
	
	// add overlay effect	
	t.addEffect("apple", loadEffect, closeEffect); 
	
})(jQuery);