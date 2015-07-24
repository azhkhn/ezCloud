/**
 * jQuery number plug-in 2.1.0
 * Copyright 2012, Digital Fusion
 * Licensed under the MIT license.
 * http://opensource.teamdf.com/license/
 *
 * A jQuery plugin which implements a permutation of phpjs.org's number_format to provide
 * simple number formatting, insertion, and as-you-type masking of a number.
 * 
 * @author	Sam Sehnert
 * @docs	http://www.teamdf.com/web/jquery-number-format-redux/196/
 */
(function($){
	
	/**
	 * Method for selecting a range of characters in an input/textarea.
	 *
	 * @param int rangeStart			: Where we want the selection to start.
	 * @param int rangeEnd				: Where we want the selection to end.
	 *
	 * @return void;
	 */
	function setSelectionRange( rangeStart, rangeEnd )
	{
		// Check which way we need to define the text range.
		if( this.createTextRange )
		{
			var range = this.createTextRange();
				range.collapse( true );
				range.moveStart( 'character',	rangeStart );
				range.moveEnd( 'character',		rangeEnd-rangeStart );
				range.select();
		}
		
		// Alternate setSelectionRange method for supporting browsers.
		else if( this.setSelectionRange )
		{
			this.focus();
			this.setSelectionRange( rangeStart, rangeEnd );
		}
	}
	
	/**
	 * Get the selection position for the given part.
	 * 
	 * @param string part			: Options, 'Start' or 'End'. The selection position to get.
	 *
	 * @return int : The index position of the selection part.
	 */
	function getSelection( part )
	{
		var pos	= this.value.length;
		
		// Work out the selection part.
		part = ( part.toLowerCase() == 'start' ? 'Start' : 'End' );
		
		if( document.selection ){
			// The current selection
			var range = document.selection.createRange(), stored_range, selectionStart, selectionEnd;
			// We'll use this as a 'dummy'
			stored_range = range.duplicate();
			// Select all text
			//stored_range.moveToElementText( this );
			stored_range.expand('textedit');
			// Now move 'dummy' end point to end point of original range
			stored_range.setEndPoint( 'EndToEnd', range );
			// Now we can calculate start and end points
			selectionStart = stored_range.text.length - range.text.length;
			selectionEnd = selectionStart + range.text.length;
			return part == 'Start' ? selectionStart : selectionEnd;
		}
		
		else if(typeof(this['selection'+part])!="undefined")
		{
		 	pos = this['selection'+part];
		}
		return pos;
	}
	
	/**
	 * Substitutions for keydown keycodes.
	 * Allows conversion from e.which to ascii characters.
	 */
	var _keydown = {
		codes : {
			188 : 44,
			109 : 45,
			190 : 46,
			191 : 47,
			192 : 96,
			220 : 92,
			222 : 39,
			221 : 93,
			219 : 91,
			173 : 45,
			187 : 61, //IE Key codes
			186 : 59, //IE Key codes
			189 : 45, //IE Key codes
			110 : 46  //IE Key codes
        },
        shifts : {
			96 : "~",
			49 : "!",
			50 : "@",
			51 : "#",
			52 : "$",
			53 : "%",
			54 : "^",
			55 : "&",
			56 : "*",
			57 : "(",
			48 : ")",
			45 : "_",
			61 : "+",
			91 : "{",
			93 : "}",
			92 : "|",
			59 : ":",
			39 : "\"",
			44 : "<",
			46 : ">",
			47 : "?"
        }
    };
	
	/**
	 * jQuery number formatter plugin. This will allow you to format numbers on an element.
	 *
	 * @params proxied for format_number method.
	 *
	 * @return : The jQuery collection the method was called with.
	 */
	$.fn.number = function( number, decimals, dec_point, thousands_sep ){
	    
	    // Enter the default thousands separator, and the decimal placeholder.
	    thousands_sep	= (typeof thousands_sep === 'undefined') ? ',' : thousands_sep;
	    dec_point		= (typeof dec_point === 'undefined') ? '.' : dec_point;
	    decimals		= (typeof decimals === 'undefined' ) ? 0 : decimals;
	    	    
	    // Work out the unicode character for the decimal placeholder.
	    var u_dec			= ('\\u'+('0000'+(dec_point.charCodeAt(0).toString(16))).slice(-4)),
	    	regex_dec_num	= new RegExp('[^'+u_dec+'0-9]','g'),
	    	regex_dec		= new RegExp(u_dec,'g');
	    
	    // If we've specified to take the number from the target element,
	    // we loop over the collection, and get the number.
	    if( number === true )
	    {
	    	// If this element is a number, then we add a keyup
	    	if( this.is('input:text') )
	    	{
	    		// Return the jquery collection.
	    		return this.on({
	    			
	    			/**
	    			 * Handles keyup events, re-formatting numbers.
	    			 *
	    			 * @param object e			: the keyup event object.s
	    			 *
	    			 * @return void;
	    			 */
	    			'keydown.format' : function(e){
	    				
	    				// Define variables used in the code below.
	    				var $this	= $(this),
	    					data	= $this.data('numFormat'),
	    					code	= (e.keyCode ? e.keyCode : e.which),
							chara	= '', //unescape(e.originalEvent.keyIdentifier.replace('U+','%u')),
	    					start	= getSelection.apply(this,['start']),
	    					end		= getSelection.apply(this,['end']),
	    					val		= '',
	    					setPos	= false;
	    				
	    				// Webkit (Chrome & Safari) on windows screws up the keyIdentifier detection
	    				// for numpad characters. I've disabled this for now, because while keyCode munging
	    				// below is hackish and ugly, it actually works cross browser & platform.
	    				
//	    				if( typeof e.originalEvent.keyIdentifier !== 'undefined' )
//	    				{
//	    					chara = unescape(e.originalEvent.keyIdentifier.replace('U+','%u'));
//	    				}
//	    				else
//	    				{
	    					if (_keydown.codes.hasOwnProperty(code)) {
					            code = _keydown.codes[code];
					        }
					        if (!e.shiftKey && (code >= 65 && code <= 90)){
					        	code += 32;
					        } else if (!e.shiftKey && (code >= 69 && code <= 105)){
					        	code -= 48;
					        } else if (e.shiftKey && _keydown.shifts.hasOwnProperty(code)){
					            //get shifted keyCode value
					            chara = _keydown.shifts[code];
					        }
					        
					        if( chara == '' ) chara = String.fromCharCode(code);
//	    				}
	    				
	    				// Stop executing if the user didn't type a number key, a decimal character, or backspace.
	    				if( code !== 8 && chara != dec_point && !chara.match(/[0-9]/) )
	    				{
	    					// We need the original keycode now...
	    					var key = (e.keyCode ? e.keyCode : e.which);
	    					if( // Allow control keys to go through... (delete, etc)
	    						key == 46 || key == 8 || key == 9 || key == 27 || key == 13 || 
	    						// Allow: Ctrl+A, Ctrl+R
	    						( (key == 65 || key == 82 ) && ( e.ctrlKey || e.metaKey ) === true ) || 
	    						// Allow: home, end, left, right
	    						( (key >= 35 && key <= 39) )
							){
								return;
							}
							// But prevent all other keys.
							e.preventDefault();
							return false;
	    				}
	    				
	    				//console.log('Continuing on: ', code, chara);
	    				
	    				// The whole lot has been selected, or if the field is empty, and the character
	    				if( ( start == 0 && end == this.value.length || $this.val() == 0 ) && !e.metaKey && !e.ctrlKey && !e.altKey && chara.length === 1 && chara != 0 )
	    				{
	    					// Blank out the field, but only if the data object has already been instanciated.
    						start = end = 1;
    						this.value = '';
    						
    						// Reset the cursor position.
	    					data.init = (decimals>0?-1:0);
	    					data.c = (decimals>0?-(decimals+1):0);
	    					setSelectionRange.apply(this, [0,0]);
	    				}
	    				
	    				// Otherwise, we need to reset the caret position
	    				// based on the users selection.
	    				else
	    				{
	    					data.c = end-this.value.length;
	    				}
	    				
	    				// If the start position is before the decimal point,
	    				// and the user has typed a decimal point, we need to move the caret
	    				// past the decimal place.
	    				if( decimals > 0 && chara == dec_point && start == this.value.length-decimals-1 )
	    				{
	    					data.c++;
	    					data.init = Math.max(0,data.init);
	    					e.preventDefault();
	    					
	    					// Set the selection position.
	    					setPos = this.value.length+data.c;
	    				}
	    				
	    				// If the user is just typing the decimal place,
	    				// we simply ignore it.
	    				else if( chara == dec_point )
	    				{
	    					data.init = Math.max(0,data.init);
	    					e.preventDefault();
	    				}
	    				
	    				// If hitting the delete key, and the cursor is behind a decimal place,
	    				// we simply move the cursor to the other side of the decimal place.
	    				else if( decimals > 0 && code == 8 && start == this.value.length-decimals )
	    				{
	    					e.preventDefault();
	    					data.c--;
	    					
	    					// Set the selection position.
	    					setPos = this.value.length+data.c;
	    				}
	    				
	    				// If hitting the delete key, and the cursor is to the right of the decimal
	    				// (but not directly to the right) we replace the character preceeding the
	    				// caret with a 0.
	    				else if( decimals > 0 && code == 8 && start > this.value.length-decimals )
	    				{
	    					if( this.value === '' ) return;
	    					
	    					// If the character preceeding is not already a 0,
	    					// replace it with one.
	    					if( this.value.slice(start-1, start) != '0' )
	    					{
	    						val = this.value.slice(0, start-1) + '0' + this.value.slice(start);
	    						$this.val(val.replace(regex_dec_num,'').replace(regex_dec,dec_point));
	    					}
	    					
	    					e.preventDefault();
	    					data.c--;
	    					
	    					// Set the selection position.
	    					setPos = this.value.length+data.c;
	    				}
	    				
	    				// If the delete key was pressed, and the character immediately
	    				// before the caret is a thousands_separator character, simply
	    				// step over it.
	    				else if( code == 8 && this.value.slice(start-1, start) == thousands_sep )
	    				{
	    					e.preventDefault();
	    					data.c--;
	    					
	    					// Set the selection position.
	    					setPos = this.value.length+data.c;
	    				}
	    				
	    				// If the caret is to the right of the decimal place, and the user is entering a
	    				// number, remove the following character before putting in the new one. 
	    				else if(
	    					decimals > 0 &&
	    					start == end &&
	    					this.value.length > decimals+1 &&
	    					start > this.value.length-decimals-1 && isFinite(+chara) &&
		    				!e.metaKey && !e.ctrlKey && !e.altKey && chara.length === 1
	    				)
	    				{
	    					// If the character preceeding is not already a 0,
	    					// replace it with one.
	    					if( end === this.value.length )
	    					{
	    						val = this.value.slice(0, start-1);
	    					}
	    					else
	    					{
	    						val = this.value.slice(0, start)+this.value.slice(start+1);
	    					}
	    					
	    					// Reset the position.
	    					this.value = val;
	    					setPos = start;
	    				}
	    				
	    				// If we need to re-position the characters.
	    				if( setPos !== false )
	    				{
	    					//console.log('Setpos keydown: ', setPos );
	    					setSelectionRange.apply(this, [setPos, setPos]);
	    				}
	    				
	    				// Store the data on the element.
	    				$this.data('numFormat', data);
	    				
	    			},
	    			
	    			/**
	    			 * Handles keyup events, re-formatting numbers.
	    			 *
	    			 * @param object e			: the keyup event object.s
	    			 *
	    			 * @return void;
	    			 */
	    			'keyup.format' : function(e){
	    				
	    				// Store these variables for use below.
	    				var $this	= $(this),
	    					data	= $this.data('numFormat'),
	    					code	= (e.keyCode ? e.keyCode : e.which),
	    					start	= getSelection.apply(this,['start']),
	    					setPos;
	    				    				    			
	    				// Stop executing if the user didn't type a number key, a decimal, or a comma.
	    				if( this.value === '' || (code < 48 || code > 57) && (code < 96 || code > 105 ) && code !== 8 ) return;
	    				
	    				// Re-format the textarea.
	    				$this.val($this.val());
	    				
	    				if( decimals > 0 )
	    				{
		    				// If we haven't marked this item as 'initialised'
		    				// then do so now. It means we should place the caret just 
		    				// before the decimal. This will never be un-initialised before
		    				// the decimal character itself is entered.
		    				if( data.init < 1 )
		    				{
		    					start		= this.value.length-decimals-( data.init < 0 ? 1 : 0 );
		    					data.c		= start-this.value.length;
		    					data.init	= 1;
		    					
		    					$this.data('numFormat', data);
		    				}
		    				
		    				// Increase the cursor position if the caret is to the right
		    				// of the decimal place, and the character pressed isn't the delete key.
		    				else if( start > this.value.length-decimals && code != 8 )
		    				{
		    					data.c++;
		    					
		    					// Store the data, now that it's changed.
		    					$this.data('numFormat', data);
		    				}
	    				}
	    				
	    				//console.log( 'Setting pos: ', start, decimals, this.value.length + data.c, this.value.length, data.c );
	    				
	    				// Set the selection position.
	    				setPos = this.value.length+data.c;
	    				setSelectionRange.apply(this, [setPos, setPos]);
	    			},
	    			
	    			/**
	    			 * Reformat when pasting into the field.
	    			 *
	    			 * @param object e 		: jQuery event object.
	    			 *
	    			 * @return false : prevent default action.
	    			 */
	    			'paste.format' : function(e){
	    				
	    				// Defint $this. It's used twice!.
	    				var $this		= $(this),
	    					original	= e.originalEvent,
	    					val		= null;
						
						// Get the text content stream.
						if (window.clipboardData && window.clipboardData.getData) { // IE
							val = window.clipboardData.getData('Text');
						} else if (original.clipboardData && original.clipboardData.getData) {
							val = original.clipboardData.getData('text/plain');
						}
						
	    				// Do the reformat operation.
	    				$this.val(val);
	    				
	    				// Stop the actual content from being pasted.
	    				e.preventDefault();
	    				return false;
	    			}
	    		
	    		})
	    		
	    		// Loop each element (which isn't blank) and do the format.
    			.each(function(){
    			
    				var $this = $(this).data('numFormat',{
    					c				: -(decimals+1),
    					decimals		: decimals,
    					thousands_sep	: thousands_sep,
    					dec_point		: dec_point,
    					regex_dec_num	: regex_dec_num,
    					regex_dec		: regex_dec,
    					init			: false
    				});
    				
    				// Return if the element is empty.
    				if( this.value === '' ) return;
    				
    				// Otherwise... format!!
    				$this.val($this.val());
    			});
	    	}
	    	else
	    	{
		    	// return the collection.
		    	return this.each(function(){
		    		var $this = $(this), num = +$this.text().replace(regex_dec_num,'').replace(regex_dec,'.');
		    		$this.number( !isFinite(num) ? 0 : +num, decimals, dec_point, thousands_sep );
		    	});
	    	}
	    }
	    
	    // Add this number to the element as text.
	    return this.text( $.number.apply(window,arguments) );
	};
	
	//
	// Create .val() hooks to get and set formatted numbers in inputs.
	//
	
	// We check if any hooks already exist, and cache
	// them in case we need to re-use them later on.
	var origHookGet = null, origHookSet = null;
	 
	// Check if a text valHook already exists.
	if( $.valHooks.text )
	{
	    // Preserve the original valhook function
	    // we'll call this for values we're not 
	    // explicitly handling.
	    origHookGet = $.valHooks.text.get;
	    origHookSet = $.valHooks.text.set;
	}
	else
	{
	    // Define an object for the new valhook.
	    $.valHooks.text = {};
	} 
	
	/**
	 * Define the valHook to return normalised field data against an input
	 * which has been tagged by the number formatter.
	 *
	 * @param object el			: The raw DOM element that we're getting the value from.
	 *
	 * @return mixed : Returns the value that was written to the element as a
	 *				   javascript number, or undefined to let jQuery handle it normally.
	 */
	$.valHooks.text.get = function( el ){
		
		// Get the element, and its data.
		var $this	= $(el), num,
			data	= $this.data('numFormat');
		
        // Does this element have our data field?
        if( !data )
        {
            // Check if the valhook function already existed
            if( $.isFunction( origHookGet ) )
            {
                // There was, so go ahead and call it
                return origHookGet(el);
            }
            else
            {
                // No previous function, return undefined to have jQuery
                // take care of retrieving the value
                return undefined;
			}
		}
		else
		{			
			// Remove formatting, and return as number.
			if( el.value === '' ) return '';
			
			// Convert to a number.
			num = +(el.value
				.replace( data.regex_dec_num, '' )
				.replace( data.regex_dec, '.' ));
			
			// If we've got a finite number, return it.
			// Otherwise, simply return 0.
			// Return as a string... thats what we're
			// used to with .val()
			return ''+( isFinite( num ) ? num : 0 );
		}
	};
	
	/**
	 * A valhook which formats a number when run against an input
	 * which has been tagged by the number formatter.
	 *
	 * @param object el		: The raw DOM element (input element).
	 * @param float			: The number to set into the value field.
	 *
	 * @return mixed : Returns the value that was written to the element,
	 *				   or undefined to let jQuery handle it normally. 
	 */
	$.valHooks.text.set = function( el, val )
	{
		// Get the element, and its data.
		var $this	= $(el),
			data	= $this.data('numFormat');
		
		// Does this element have our data field?
		if( !data )
		{
		    // Check if the valhook function already existed
		    if( $.isFunction( origHookSet ) )
		    {
		        // There was, so go ahead and call it
		        return origHookSet(el,val);
		    }
		    else
		    {
		        // No previous function, return undefined to have jQuery
		        // take care of retrieving the value
		        return undefined;
			}
		}
		else
		{
			return el.value = $.number( val, data.decimals, data.dec_point, data.thousands_sep )
		}
	};
	
	/**
	 * The (modified) excellent number formatting method from PHPJS.org.
	 * http://phpjs.org/functions/number_format/
	 *
	 * @modified by Sam Sehnert (teamdf.com)
	 *	- don't redefine dec_point, thousands_sep... just overwrite with defaults.
	 *	- don't redefine decimals, just overwrite as numeric.
	 *	- Generate regex for normalizing pre-formatted numbers.
	 *
	 * @param float number			: The number you wish to format, or TRUE to use the text contents
	 *								  of the element as the number. Please note that this won't work for
	 *								  elements which have child nodes with text content.
	 * @param int decimals			: The number of decimal places that should be displayed. Defaults to 0.
	 * @param string dec_point		: The character to use as a decimal point. Defaults to '.'.
	 * @param string thousands_sep	: The character to use as a thousands separator. Defaults to ','.
	 *
	 * @return string : The formatted number as a string.
	 */
	$.number = function( number, decimals, dec_point, thousands_sep ){
		
		// Set the default values here, instead so we can use them in the replace below.
		thousands_sep	= (typeof thousands_sep === 'undefined') ? ',' : thousands_sep;
		dec_point		= (typeof dec_point === 'undefined') ? '.' : dec_point;
		decimals		= !isFinite(+decimals) ? 0 : Math.abs(decimals);
		
		// Work out the unicode representation for the decimal place.	
		var u_dec = ('\\u'+('0000'+(dec_point.charCodeAt(0).toString(16))).slice(-4));
		
		// Fix the number, so that it's an actual number.
		number = (number + '')
			.replace(new RegExp(u_dec,'g'),'.')
			.replace(new RegExp('[^0-9+\-Ee.]','g'),'');
		
		var n = !isFinite(+number) ? 0 : +number,
		    s = '',
		    toFixedFix = function (n, decimals) {
		        var k = Math.pow(10, decimals);
		        return '' + Math.round(n * k) / k;
		    };
		
		// Fix for IE parseFloat(0.55).toFixed(0) = 0;
		s = (decimals ? toFixedFix(n, decimals) : '' + Math.round(n)).split('.');
		if (s[0].length > 3) {
		    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, thousands_sep);
		}
		if ((s[1] || '').length < decimals) {
		    s[1] = s[1] || '';
		    s[1] += new Array(decimals - s[1].length + 1).join('0');
		}
		return s.join(dec_point);
	}
	
})(jQuery);















function valida_field(obj){

           var isFormValid = true;
           var baseObj = obj;
           
        baseObj = baseObj + " .required";

        $(baseObj).each(function(){
        
        var objj = $(this).attr("name");
        var hazlo = true;
        
        if ( $(this).attr("name") == 'state' ) {
            if( $.trim($('#subscription_country').val()) == 'United States' ){
              hazlo = true;                
            }else{
                hazlo = false;}
        }

         if(hazlo){
            if ($.trim($(this).val()).length == 0 ){
                    $(this).addClass("highlight");
                    isFormValid = false;
                }
                else{
                    $(this).removeClass("highlight");
                }
        }
    });


    return isFormValid;
    
}
function showEnterprise(tp){
    if(tp == 1){
        $(".companyFields").removeClass("suspendStep");
        $(".companyFields").addClass("activeStep");   
        	$("#inputcompanyCode").addClass("required");
    }else{
        $(".companyFields").addClass("suspendStep");
        $(".companyFields").removeClass("activeStep");
        	$("#inputcompanyCode").removeClass("required");
    }
}

    function valida_first_step(step){
           var isFieldValid = true;	
           var isFormValid = true;
           var baseObj = "";
           
           if(step == 1){
               baseObj = "#subscriptionBaseStep1";
           }else{
               baseObj = "#subscriptionBaseStep2";
           }
        baseObj = baseObj + " .required";

        $(baseObj).each(function(){
        
        	isFieldValid = true;
        var objj = $(this).attr("name");
        var hazlo = true;
        
        if ( $(this).attr("name") == 'state' ) {
            if($.trim($('#SelectCountry').val()) == 'United States'){
                hazlo = true;                
                }else{
                    hazlo = false;
                    }
        }    
        
        if ( ( $(this).attr("name") == 'companyName' ||  $(this).attr("name") == 'companyCode' ) ) {
            if($("#accType2").prop("checked")){
                hazlo = true;            
                }else{
                    hazlo = false;
                    }
        }
        
        if(hazlo){
            if ($.trim($(this).val()).length == 0 ){
            	isFieldValid = false;
        		isFormValid = false;
                }                
           if( $(this).attr("name") == 'companyCode' ){
        	   isFieldValid = letterNumberSpace( $(this) );       	   
           		}
           if( isFieldValid == false ){
               		$(this).addClass("highlight");
               		isFormValid = false;
           		}else{
           			$(this).removeClass("highlight");        	   
           		}
        }
        
    });

    if(baseObj == "#subscriptionBaseStep2"){  
        isFormValid = validaCardDate();
    }


    return isFormValid;
 
    }
    function validaCardDate(){
        var isFormValid = validExpireDate( $("#SelectcardExpMonth").val() ,  $("#SelectCardExpYear").val() );

        if( isFormValid == false ){
            $("#SelectcardExpMonth").addClass("highlight");
            $("#SelectCardExpYear").addClass("highlight");
        }else{
            $("#SelectcardExpMonth").removeClass("highlight");
            $("#SelectCardExpYear").removeClass("highlight");
        }
        
        return isFormValid;
        
    }


    function validAndSubmitAutobuy(onlyValue,formId){
        var className = "highlight"      
        var fine = false;
        
        $(this).addClass(className);
        $(this).removeClass(className);     

                if(   $( formId + ' input[name=autobuy_aps]').is(':checked') == true ) {

                    if( $(formId + ' input[name=quantity_aps_autobuy]').val() != "0" && $(formId + ' input[name=quantity_aps_autobuy]').val() != "" && $.isNumeric($(formId + ' input[name=quantity_aps_autobuy]').val()) ) {
                        $(formId + ' input[name=quantity_aps_autobuy]').removeClass(className);
                        fine = true;
                    }else{
                        $(formId + ' input[name=quantity_aps_autobuy]').addClass(className);
                        fine = false;
                    }
                    if($(formId + ' input[name=min_licenses_aps_remain]').val() != "0" && $(formId + ' input[name=min_licenses_aps_remain]').val() != "" && $.isNumeric($(formId + ' input[name=min_licenses_aps_remain]').val()) ) {
                        $(formId + ' input[name=min_licenses_aps_remain]').removeClass(className);
                        fine = true;
                    }else{
                        $(formId + ' input[name=min_licenses_aps_remain]').addClass(className);
                        fine = false;
                    }
                }

                if( $(formId + ' input[name=renew_licenses]').is(':checked') == true ) {
                    if($(formId + ' select[name=period_credits_autobuy]').val() != "0" && $(formId + ' select[name=period_credits_autobuy]').val() != "" && $.isNumeric($(formId + ' select[name=period_credits_autobuy]').val()) ) {
                        $(formId + ' select[name=period_credits_autobuy]').removeClass(className);
                        fine = true;
                    }else{
                        $(formId + ' select[name=period_credits_autobuy]').addClass(className);
                        fine = false;
                    }
                }
        
        
        if(fine ==  true){
            AutoBuySubmit(formId);
        }
    }

    
    function validExpireDate(selectedMonth,  selectedYear){
        var dateValidate = false;
        
        var currentYear = new Date().getFullYear();
        var currentMonth = new Date().getMonth();

        if(selectedYear > currentYear){
            dateValidate = true;
        }else if(selectedYear = currentYear) {
            if(selectedMonth > currentMonth){
                dateValidate = true;
            }
        }
        
        return dateValidate ;
    }
    
    function letterNumberSpace(elem){
    	var isCValid = true;	
	    	    var inputVal = elem.val();
	    	    var characterReg = /^\s*[a-zA-Z0-9,\s]+\s*$/;
	    	    if(!characterReg.test(inputVal)) {
	    	    	isCValid = false;
	    	    }
	    	return isCValid;
    }
    
    function showCard( cls ){
        
        $('.credit-img').removeClass("active");
        if( cls != "" ) {      
            $('.credit-img').removeClass("Visa");
            $('.credit-img').removeClass("AmericanExpress");
            $('.credit-img').removeClass("MasterCard");
            $('.credit-img').removeClass("Discover");

            $('.credit-img').addClass("active");
            $('.credit-img').addClass(cls);
            cardmask(cls);
        }
    }
    
    function cardmask(cls){
       
       $("#inputcardNumber1").data('mask', '9999-9999-9999-9999');
       $("#inputcardNumber1").attr('maxlength', '16');
       $("#inputcardNumber1").attr('pattern', '\d16');
       $("#inputcardNumber1").attr('placeholder', '9999-9999-9999-9999');
       
       if(cls == "AmericanExpress"){
        $("#inputcardNumber1").data('mask', '9999-999999-99999');
        $("#inputcardNumber1").attr('maxlength', '15');
        $("#inputcardNumber1").attr('pattern', '\d15');
        $("#inputcardNumber1").attr('placeholder', '9999-999999-99999');
        
        $("#inputSecurityCode").attr('maxlength', '4');
       }
       
    }
    
    function move_step2_subcription(){
        var validato = valida_first_step('1');
        var oObj = "#subscriptionBaseStep1";
        var nObj = "#subscriptionBaseStep2";
       
       if ( validato == true){
            showAndHide(oObj,nObj); 
       }else{
           alert("Please Complete all fields..");
       }
       
    }
    function move_step1_subcription(){

            var oObj = "#subscriptionBaseStep2";
            var nObj = "#subscriptionBaseStep1";
            
            showAndHide(oObj,nObj); 
    }
  function showAndHide(oObj,nObj){
      
            $(oObj).removeClass("activeStep");
            $(oObj).addClass("suspendStep");
            
            $(nObj).removeClass("suspendStep");
            $(nObj).addClass("activeStep");
      
  }  
  
function paymethodSubmit(frm){
        var validato = valida_field(frm);

        if(validato){
            var params="action=userAccount_paymentmethod_submit";
            var timestampId=new Date().getTime();
            history_ajax[""+timestampId]=new Array(""+timestampId);
            params=params+"&timestampId="+timestampId;
            lastInterruptible=""+timestampId;
            params=params+"&tz="+tsDiff+"&";
            
            var formval = $(frm).serialize();
            
            params = params + formval;
            
            showLoader("menuLevel3");
            showLoader("content");
            $.post(getServer()+"index.php?", params, function(data2) {
                //console.log("eseguita:"+data2.menu3);
                if (stopExecution(data2)) {
                    return;
                }
                showSection("menuLevel3");
                showSection("content", data2.content);                
                if (data2.postJavascript != null) {
                    eval(data2.postJavascript);
                }
                updateMainSize();
            },'jsonp');
        }       
   } 
   function contactSubmit(frm){
        var validato = valida_field(frm);

        if(validato){
            var params="action=userAccount_contact_submit";
            var timestampId=new Date().getTime();
            history_ajax[""+timestampId]=new Array(""+timestampId);
            params=params+"&timestampId="+timestampId;
            lastInterruptible=""+timestampId;
            params=params+"&tz="+tsDiff+"&";
            
            var formval = $(frm).serialize();
            
            params = params + formval;
            
            showLoader("menuLevel3");
            showLoader("content");
            $.post(getServer()+"index.php?", params, function(data2) {
                //console.log("eseguita:"+data2.menu3);
                if (stopExecution(data2)) {
                    return;
                }
                showSection("menuLevel3");
                showSection("content", data2.content);                
                if (data2.postJavascript != null) {
                    eval(data2.postJavascript);
                }
                updateMainSize();
            },'jsonp');
        }       
   }    
 
    function SubcribeSubmit(){
        var validato = valida_first_step('2');

        if(validato){

            var params="action=userAccount_subscription_submit";
            var timestampId=new Date().getTime();
            history_ajax[""+timestampId]=new Array(""+timestampId);
            params=params+"&timestampId="+timestampId;
            lastInterruptible=""+timestampId;
            params=params+"&tz="+tsDiff+"&";
            
            var formval = $("#subcribeForm").serialize();
            
            params = params + formval;
            
            showLoader("menuLevel3");
            showLoader("content");
            $.post(getServer()+"index.php?", params, function(data2) {
                //console.log("eseguita:"+data2.menu3);
                if (stopExecution(data2)) {
                    return;
                }
                showSection("menuLevel3");
                showSection("content", data2.content);                
                if (data2.postJavascript != null) {
                    eval(data2.postJavascript);
                }
                updateMainSize();
            },'jsonp');
        }

    }
function AddCreditSubmit(form_name){

            var params="action=userAccount_addCredit_submit";
            var timestampId=new Date().getTime();
            history_ajax[""+timestampId]=new Array(""+timestampId);
            params=params+"&timestampId="+timestampId;
            lastInterruptible=""+timestampId;
            params=params+"&tz="+tsDiff+"&";
            
            var formval = $(form_name).serialize();
            params = params + formval;
            showLoader("menuLevel3");
            showLoader("content");
            $.post(getServer()+"index.php?", params, function(data2) {
                //console.log("eseguita:"+data2.menu3);
                if (stopExecution(data2)) {
                    return;
                }
                showSection("menuLevel3");
                showSection("content", data2.content);                
                if (data2.postJavascript != null) {
                    eval(data2.postJavascript);
                }
                updateMainSize();
            },'jsonp');
        

    }
function AddLicensesSubmit(form_name){

            var params="action=userAccount_addLicenses_submit";
            var timestampId=new Date().getTime();
            history_ajax[""+timestampId]=new Array(""+timestampId);
            params=params+"&timestampId="+timestampId;
            lastInterruptible=""+timestampId;
            params=params+"&tz="+tsDiff+"&";
            
            var formval = $(form_name).serialize();
            params = params + formval;
            showLoader("menuLevel3");
            showLoader("content");
            $.post(getServer()+"index.php?", params, function(data2) {
                //console.log("eseguita:"+data2.menu3);
                if (stopExecution(data2)) {
                    return;
                }
                showSection("menuLevel3");
                showSection("content", data2.content);                
                if (data2.postJavascript != null) {
                    eval(data2.postJavascript);
                }
                updateMainSize();
            },'jsonp');
        

    }
    
    function AutoBuySubmit(form_name){

            var params="action=userAccount_autobuy_credit_submit";
            var timestampId=new Date().getTime();
            history_ajax[""+timestampId]=new Array(""+timestampId);
            params=params+"&timestampId="+timestampId;
            lastInterruptible=""+timestampId;
            params=params+"&tz="+tsDiff+"&";
            
            var formval = $(form_name).serialize();
            params = params + formval;
            showLoader("menuLevel3");
            showLoader("content");
            $.post(getServer()+"index.php?", params, function(data2) {
                if (stopExecution(data2)) {
                        return;
                }
                
                showSection("menuLevel3");
                showSection("content", data2.content);                

                if (data2.postJavascript != null) {
                    eval(data2.postJavascript);
                }
                updateMainSize();
            },'jsonp');
        

    }
    function incrementAndCalLicenses(form, obj, min, op,price,currency,formClone,fieldSource){
        incrementValue(form, obj, min, op);

        var field       = $(form+" input[name="+obj+"]");
        var fieldValue  = field.val() * 1;
        var total = 0;
            
        total = fieldValue * price; 
        
        $(form+" .total").html( "<span>"+currency+"</span>"+$.number(total,0) );
        
        if( formClone != null ){
            var fieldClone       = $(formClone+" input[name="+fieldSource+"]");
                fieldClone.val( fieldValue+"");
        }
                        
    }    
    function incrementAndCalValue(form, obj, min, op,year,price,currency,formClone,fieldSource,base,tp){
        incrementValue(form, obj, min, op);

        var field       = $(form+" input[name="+obj+"]");
        var fieldValue  = field.val() * 1;
        var total = 0;
            
        total = fieldValue * ( price * year); 
        
        $(form+" .total").html( "<span>"+currency+"</span>"+$.number(total,0) );

        var fieldClone       = $(formClone+" input[name="+fieldSource+"]");
            fieldClone.val( fieldValue+"");
            
            $("."+base+" input[type="+tp+"]").val(fieldValue+"");
                        
    }
    
    function incrementValue(form, obj, min, op){

        var field       = $(form+" input[name="+obj+"]");
        var fieldValue  = field.val() * 1;
        var Value       = fieldValue;
        
        if( op != null ){
            if(op == "-" && fieldValue > min )  {
                Value = fieldValue - 1 ; 
            }else if(op == "+"){
                Value = fieldValue + 1 ; 
            }
            if(Value < 0){
                Value = 0;
            }
        }else{
            if( min !=null ){
                if(Value < min){
                    Value = min;
                }
            }
            }

        field.val( $.number(Value,0)+"");

    }
    
    function addcreditNumber( obj,min,op,currency){
                
        var field       = $(obj+" input[name=quantity]");
        var fieldValue  = field.val() * 1;
        var Value       = fieldValue;
        
        if( op != null ){
            if(op == "-" && fieldValue > min )  {
                Value = fieldValue - 1 ; 
            }else if(op == "+"){
                Value = fieldValue + 1 ; 
            }
        }else{
            if(Value < min){
                Value = min;
            }
        }
        
        var objj = $( obj.replace("form","") ); // $("#form2c92a0fb456e3bb30145750357ce6445");
        
        $.each( objj.parent(), function(i, childd) { 
            $('div.tab-pane', childd).each(function() {     
                $(this).find(" input[name=quantity]").val( Value ) ;
               /* $(this).find(" .total_aps").html( Value ) ; */
                
                var frm_obj = "." + $(this).find("form").attr("id") ; 
                var total_credit    = $(frm_obj+"_total_credit");
                var total           = $(frm_obj+"_total");
                var save_total      = $(frm_obj+"_total_save");
                var qty_months      = $(this).find(" input[name=qty_months]");
                var price_licenses  = $(this).find(" input[name=price_licenses]");

                var preview_qty_months      = $(this).find(" input[name=preview_qty_months]");
                var preview_price           = $(this).find(" input[name=preview_price_licenses]");
                
                var stotal =  ( ( (preview_price.val() / preview_qty_months.val() ) * qty_months.val() ) * Value )- (price_licenses.val() * Value) ;
        
                if((price_licenses.val() * Value) > 0){
                    $(this).find("button").removeAttr("disabled");
                }else{
                    $(this).find("button").attr("disabled", "disabled");
                }
                
                save_total.html( $.number(stotal,0) );
                total_credit.html( $.number((qty_months.val() * Value), 0 )  );
                total.html( currency + " " + $.number((price_licenses.val() * Value),0) );


            }); 
        });
        
        /*
        field.val( Value );        
        var total_credit    = $(obj+"_total_credit");
        var total           = $(obj+"_total");
        
        var qty_months      = $(obj+" input[name=qty_months]");
        var price_licenses  = $(obj+" input[name=price_licenses]");
        
        total_credit.html( $.number((qty_months.val() * Value), 0 )  );
        total.html( currency + " " + $.number((price_licenses.val() * Value),0) );
        
        */
    }
    
function updateContact(){
        
        var params="action=userAccount_update_contact";
        var timestampId=new Date().getTime();
        history_ajax[""+timestampId]=new Array(""+timestampId);
        params=params+"&timestampId="+timestampId;
        lastInterruptible=""+timestampId;
        params=params+"&tz="+tsDiff+"&";

        var formval = $("form[name='ContactZForm']").serialize();

        params = params + formval;

        showLoader("menuLevel3");
        showLoader("content");
        $.post(getServer()+"index.php?", params, function(data2) {
            //console.log("eseguita:"+data2.menu3);
            if (stopExecution(data2)) {
                return;
            }
            if (data2.error != null) {
                //error result
            }
            else{
                alert(data2.contact.email);
            }
            showSection("menuLevel3" );
            showSection("content");                
            if (data2.postJavascript != null) {
                eval(data2.postJavascript);
            }
            updateMainSize();
        },'jsonp');

    }
    function display_more(content){
        
        if ( $(content).hasClass('suspendStep') ){
            $(content).removeClass("suspendStep");
            $(content).addClass("activeStep");
        }else{
            $(content).addClass("suspendStep");
            $(content).removeClass("activeStep");   
        }
        updateMainSize();
    }   

    function display_row(content){
        
        if ( $(content).hasClass('suspendStep') ){
            $(content).removeClass("suspendStep");
        }else{
            $(content).addClass("suspendStep");  
        }
    }
    
    function choose_plan(plan, sku){
        $("#prdName").val(plan);
        $("#prdSKU").val(sku);
    }

    function choose_plan_credit(plan, sku, chargeid, qty_month){
        choose_plan(plan, sku);    
        $("#ChargeId").val(chargeid);
        $("#qtyMonth").val(qty_month);
    }

    function currencyFromCountry(obj){
        var cty = $("#SelectCountry").val().replace('"',"'");
        
        if( cty == "United States" || cty == "United States Minor Outlying Islands" ){
           $(".fldstate").removeClass("suspendStep");
           $(".fldstate").addClass("activeStep");
        }else{
            $(".fldstate").val("");
            $(".fldstate").addClass("suspendStep");
            $(".fldstate").removeClass("activeStep");
        }
      
        var arr = [ ["Afghanistan","USD"],["Aland Islands","USD"],["Albania","EUR"],["Algeria","USD"],["American Samoa","USD"],["Andorra","EUR"],["Angola","USD"],["Anguilla","USD"],["Antarctica","USD"],["Antigua And Barbuda","USD"],["Argentina","USD"],["Armenia","USD"],["Aruba","USD"],["Australia","USD"],["Austria","EUR"],["Azerbaijan","USD"],["Bahamas","USD"],["Bahrain","USD"],["Bangladesh","USD"],["Barbados","USD"],["Belarus","USD"],["Belgium","EUR"],["Belize","USD"],["Benin","USD"],["Bermuda","USD"],["Bhutan","USD"],["Bolivia","USD"],["Bonaire, Saint Eustatius and Saba","USD"],["Bosnia and Herzegovina","USD"],["Botswana","USD"],["Bouvet Island","USD"],["Brazil","USD"],["British Indian Ocean Territory","GBP"],["Brunei Darussalam","USD"],["Bulgaria","USD"],["Burkina Faso","USD"],["Burundi","USD"],["Cambodia","USD"],["Cameroon","USD"],["Canada","USD"],["Cape Verde","USD"],["Cayman Islands","USD"],["Central African Republic","USD"],["Chad","USD"],["Chile","USD"],["China","USD"],["Christmas Island","USD"],["Cocos (Keeling) Islands","USD"],["Colombia","USD"],["Comoros","USD"],["Congo","USD"],["Congo, the Democratic Republic of the","USD"],["Cook Islands","USD"],["Costa Rica","USD"],["Cote d'Ivoire","USD"],["Croatia","USD"],["Cuba","USD"],["Curacao","USD"],["Cyprus","EUR"],["Czech Republic","USD"],["Denmark","USD"],["Djibouti","USD"],["Dominica","USD"],["Dominican Republic","USD"],["Ecuador","USD"],["Egypt","USD"],["El Salvador","USD"],["Equatorial Guinea","USD"],["Eritrea","USD"],["Estonia","EUR"],["Ethiopia","USD"],["Falkland Islands (Malvinas)","USD"],["Faroe Islands","USD"],["Fiji","USD"],["Finland","EUR"],["France","EUR"],["French Guiana","USD"],["French Polynesia","USD"],["French Southern Territories","USD"],["Gabon","USD"],["Gambia","USD"],["Georgia","USD"],["Germany","EUR"],["Ghana","USD"],["Gibraltar","GBP"],["Greece","EUR"],["Greenland","USD"],["Grenada","USD"],["Guadeloupe","USD"],["Guam","USD"],["Guatemala","USD"],["Guernsey","GBP"],["Guinea","USD"],["Guinea-Bissau","USD"],["Guyana","USD"],["Haiti","USD"],["Heard Island and McDonald Islands","USD"],["Holy See (Vatican City State)","EUR"],["Honduras","USD"],["Hong Kong","USD"],["Hungary","USD"],["Iceland","USD"],["India","USD"],["Indonesia","USD"],["Iran, Islamic Republic of","USD"],["Iraq","USD"],["Ireland","EUR"],["Isle of Man","USD"],["Israel","USD"],["Italy","EUR"],["Jamaica","USD"],["Japan","USD"],["Jersey","USD"],["Jordan","USD"],["Kazakhstan","USD"],["Kenya","USD"],["Kiribati","USD"],["Korea, Democratic People's Republic of","USD"],["Korea, Republic of","USD"],["Kuwait","USD"],["Kyrgyzstan","USD"],["Lao People's Democratic Republic","USD"],["Latvia","USD"],["Lebanon","GBP"],["Lesotho","USD"],["Liberia","USD"],["Libyan Arab Jamahiriya","USD"],["Liechtenstein","USD"],["Lithuania","USD"],["Luxembourg","EUR"],["Macao","USD"],["Macedonia, the former Yugoslav Republic of","USD"],["Madagascar","USD"],["Malawi","USD"],["Malaysia","USD"],["Maldives","USD"],["Mali","USD"],["Malta","EUR"],["Marshall Islands","USD"],["Martinique","USD"],["Mauritania","USD"],["Mauritius","USD"],["Mayotte","USD"],["Mexico","USD"],["Micronesia, Federated States of","USD"],["Moldova, Republic of","USD"],["Monaco","EUR"],["Mongolia","USD"],["Montenegro","EUR"],["Montserrat","USD"],["Morocco","USD"],["Mozambique","USD"],["Myanmar","USD"],["Namibia","USD"],["Nauru","USD"],["Nepal","USD"],["Netherlands","EUR"],["New Caledonia","USD"],["New Zealand","USD"],["Nicaragua","USD"],["Niger","USD"],["Nigeria","USD"],["Niue","USD"],["Norfolk Island","USD"],["Northern Mariana Islands","USD"],["Norway","EUR"],["Oman","USD"],["Pakistan","USD"],["Palau","USD"],["Palestinian Territory, Occupied ","USD"],["Panama","USD"],["Papua New Guinea","USD"],["Paraguay","USD"],["Peru","USD"],["Philippines","USD"],["Pitcairn","USD"],["Poland","USD"],["Portugal","EUR"],["Puerto Rico","USD"],["Qatar","USD"],["Reunion","USD"],["Romania","USD"],["Russian Federation","USD"],["Rwanda","USD"],["Saint Barthelemy","USD"],["Saint Helena","GBP"],["Saint Kitts and Nevis","USD"],["Saint Lucia","USD"],["Saint Martin (French part)","USD"],["Saint Pierre and Miquelon","USD"],["Saint Vincent and the Grenadines","USD"],["Samoa","USD"],["San Marino","EUR"],["Sao Tome and Principe","USD"],["Saudi Arabia","USD"],["Senegal","USD"],["Serbia","USD"],["Seychelles","USD"],["Sierra Leone","USD"],["Singapore","USD"],["Sint Maarten","USD"],["Slovakia","EUR"],["Slovenia","EUR"],["Solomon Islands","USD"],["Somalia","USD"],["South Africa","USD"],["South Georgia and the South Sandwich Islands","USD"],["Spain","EUR"],["Sri Lanka","USD"],["Sudan","GBP"],["Suriname","USD"],["Svalbard and Jan Mayen","USD"],["Swaziland","USD"],["Sweden","USD"],["Switzerland","USD"],["Syrian Arab Republic","USD"],["Taiwan","USD"],["Tajikistan","USD"],["Tanzania, United Republic of","USD"],["Thailand","USD"],["Timor-Leste","USD"],["Togo","USD"],["Tokelau","USD"],["Tonga","USD"],["Trinidad and Tobago","USD"],["Tunisia","USD"],["Turkey","USD"],["Turkmenistan","USD"],["Turks and Caicos Islands","USD"],["Tuvalu","USD"],["Uganda","USD"],["Ukraine","USD"],["United Arab Emirates","USD"],["United Kingdom","GBP"],["United States","USD"],["United States Minor Outlying Islands","USD"],["Uruguay","USD"],["Uzbekistan","USD"],["Vanuatu","USD"],["Venezuela","USD"],["Viet Nam","USD"],["Virgin Islands, British","GBP"],["Virgin Islands, U.S.","USD"],["Wallis and Futuna","USD"],["Western Sahara","USD"],["Yemen","USD"],["Zambia","USD"],["Zimbabwe","USD"] ] ;
        var cry = "USD";
        for ( var i = 0, l = arr.length; i < l; i++ ) {
            if(arr[i][0] == cty ){
                cry = arr[i][1] ;
            }
        }
        $(obj).val(cry);

    }
    

