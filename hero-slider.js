/*
	Credit to Max Rolon
	compatible with jQuery version +1.7
*/

(function() {

	/*
		use an anonymous function to ensure 
		that the logic inside the function is executed immediately. 

		@params element 	element 	slider element
		@params array	settings

		@returns HeroSlider instance
	*/
	var HeroSlider = (function(element, settings) {

		// unique ID for every instance of hero-slider
		var instanceUid = 0;

		/*
			constructor
			
			@params element 	element 	slider element
			@params array	settings

			@returns void
		*/
		function _HeroSlider(element, settings) {
			// default slider settings 
			this.defaults = {
				// The amount of time between animations (milliseconds)
				slideDuration: "3000",
				// The speed of the animation (milliseconds)
				speed: 500,
				// A jQuery reference to the right arrow
				arrowRight: ".arrow.next",
				// A jQuery reference to the left arrow 
				arrowLeft: ".arrow.previous"
			};

			// default settings merged with user supplied settings
			this.settings = $.extend(
				{}, 
				this, 
				this.defaults, 
				settings);

			// holds values that will change as the plugin operates
			this.initials = {
				currentSlide: 0,
				$currentSlide: null,
				totalSlides: false
			};

			// attach this.initials as a direct properties of HeroSlider
			$.extend(this, this.initials);

			// hold a reference to the DOM element passed in
			// by the $.each function when this plugin was instantiated
			this.$carousel = $(element);

			// ensure that the value of 'this' always references HeroSlider
			this.changeSlide = $.proxy(this.changeSlide, this);

			// we'll call our initiator function to get things rolling!
			this.init();

			// a little bit of metadata about the instantiated object
			// This property will be inecremented everytime a new HeroSlider carousel is created
			// It provides each carousel with a unique ID
			this.instanceUid = instanceUid++;
		}

		return _HeroSlider;

	// execute HeroSlider
	})();

	/*
		Calls starter methods and associate the '.hero-slider-carousel' class

		@params void

		@returns void
	*/
	HeroSlider.prototype.init = function() {

		// test to see if css animations are available
		this.setSupportedCSSTransition();

		// add a class so we can style our carousel
		this.$carousel.addClass("hero-slider-carousel");

		// build out any DOM elements needed for the plugin to run
		this.build();

		// associate event handlers to events
		this.events();

		// set the first slide to the current slide in the carousel
		this.$currentSlide = this.$carousel.find(".slide").eq(0);

		// start the timer loop to control progression to the next slide
		this.initTimer();

	};

	/*
		Appropriated out of Modernizr v2.8.3
		Creates a new DOM element and tests existence of properties on it's
		Style object to see if CSSTransitions are available

		@params void

		@returns void
	*/
	HeroSlider.prototype.setSupportedCSSTransition = function() {

		// create a modernizr element
		var modernizrElement = document.createElement("modernizr");

		// A list of properties to test for
		var cssProperties = ["transition", "WebkitTransition", "MozTransition", "OTransition", "msTransition"];

		// Iterate through our new element's Style property to see if these properties exist
		for (var i in cssProperties) {
			// get the property
			var property = cssProperties[i];
			
			// detect if it is supported
			var propertySupported = modernizrElement.style[property] !== undefined ? property : false;
			
			// if it is then update the transition type and return
			if (propertySupported) {
				this.supportedCSSTransition = propertySupported;
				break;
			}
		}
	};

	/*
		Sets the total number of slides

		@params void

		@returns void
	*/
	HeroSlider.prototype.build = function() {
		
		// set the number of slides
		this.totalSlides = this.$carousel.find(".slide").length;
	};

	/*
	 	Associate event handlers to events
	 
	 	@params void
	 
	 	@returns void
	 */
	HeroSlider.prototype.events = function() {
		
		$("body")
			// add click event to right arrow 
			.on(
				"click", 
				this.settings.arrowRight, 
				{ direction: "right" }, 
				this.changeSlide)
			// add click event to left arrow
			.on(
				"click", 
				this.settings.arrowLeft, 
				{ direction: "left" }, 
				this.changeSlide);
	};

	/*
	 	TIMER
	 	Initialise the timer
	 
	 	@params void
	 	
	 	@returns void
	 */
	HeroSlider.prototype.initTimer = function() {
		
		// set up the timer
		this.timer = setInterval(this.changeSlide, this.settings.slideDuration);
	};

	/*
	 	TIMER
	 	Resets the timer
	 
	 	@params void
	 
	 	@returns void
	 */
	HeroSlider.prototype.clearTimer = function() {
		
		// if the timer exists
		if (this.timer) {
			// clear the timer
			clearInterval(this.timer);
		}
	};

	/*
	 	TIMER
	 	Start the timer
	 	Reset the canChangeSlide to allow changeSlide to be executable
	 
	 	@params void
	 
	 	@returns void
	 */
	HeroSlider.prototype.startTimer = function() {
		
		// start the timer
		this.initTimer();
		
		// allow the slide to be changed
		this.canChangeSlide = true;
	};

	/*
	 	MAIN LOGIC HANDLER
	 	Triggers a set of subfunctions to carry out the animation
	 
	 	@params	object 	event
	 	
	 	@returns void
	 */
	HeroSlider.prototype.changeSlide = function(e) {
		
		// allow the slide to be changed if not otherwise specified 
		this.canChangeSlide = (typeof this.canChangeSlide === "undefined") ? true : this.canChangeSlide;
		
		// ensure that animations are triggered one at a time		
		if (!this.canChangeSlide) {
			return;
		}

		// make sure another changeSlide event is not executed
		// while changing the current slide
		this.canChangeSlide = false;

		// stop the timer as the animation is getting carried out
		this.clearTimer();

		// returns the direction for next slide
		var direction = this._getDirection(e);

		// get the index of the next slide
		var nextSlideIndex = this._getNextSlideIndex(e, direction);

		// activate the next slide to scroll into view
		var $nextSlide = this.$carousel.find(".slide").eq(this.currentSlide).addClass("fade-in active");

		// if CSS transion property is supported
		if (this.supportedCSSTransition !== "undefined") {
			// animate with CSS
			this._cssAnimation($nextSlide, direction);
		} else {
			// otherwise, animate with JS
			this._jsAnimation($nextSlide, direction);
		}
	};

	/*
	 	Returns the animation direction, right or left
	 
	 	@params	object 	event
	 
	 	@returns string		direction 	animation direction
	 */
	HeroSlider.prototype._getDirection = function(e) {
		
		var direction;

		// if e is not undefined
		if (typeof e !== "undefined") {
			// not specified, then default to right, otherwise use specified
			direction = (typeof e.data === "undefined" ? "right" : e.data.direction);
		} else {
			// else default to right
			direction = "right";
		}

		// return the direction
		return direction;
	};

	/*
	 	Updates our plugin with the next slide number
	 
	 	@params	object	event
	 	@params	string	direction 	animation direction
	 
	 	@returns boolean 	continue to animate?
	 */
	HeroSlider.prototype._getNextSlideIndex = function(e, direction) {
		//Logic for determining the next slide
		switch (true) {
			// if the next button was clicked and we are not at the last slide
			case (direction == "right" && this.currentSlide < (this.totalSlides - 1)):
				// advance to the next slide
				this.currentSlide++;
				break;
			
			// if the next button was clicked 
			case (direction == "right"):
				// start from the first slide
				this.currentSlide = 0;
				break;
			
			//if the previous button was clicked and we are on the first slide
			case (direction == "left" && this.currentSlide === 0):
				// move to the last slide
				this.currentSlide = (this.totalSlides - 1);
				break;
			
			// if the previous button was clicked
			case (direction == "left"):
				// move back a slide
				this.currentSlide--;
				break;
		}

		return true;
	};

	/*
	 	Executes the animation via CSS transitions
	 
	 	@params	object	nextSlide 	Jquery object the next slide to slide into view
	 	@params	string	direction 	animation direction
	 
	 	@returns void
	 */
	HeroSlider.prototype._cssAnimation = function($nextSlide, direction) {
		
		// animate the current slide
		setTimeout(function() {
			this.$carousel.addClass("transition");
			this.addCSSDuration();
			this.$currentSlide.addClass("fade-out");
		}.bind(this), 100);

		// cleanup classes and styles
		setTimeout(function() {
			this.$carousel.removeClass("transition");
			this.removeCSSDuration();
			this.$currentSlide.removeClass("active fade-in fade-out");
			this.$currentSlide = $nextSlide.removeClass("fade-in");
			this.startTimer();
		}.bind(this), (100 + this.settings.speed));
	};

	/*
		Add the CSS transition duration to the DOM Object's Style property
		We trigger this function just before we want the slides to animate

		@params void

		@returns void
	*/
	HeroSlider.prototype.addCSSDuration = function() {

		var _ = this;

		// for each slide
		this.$carousel.find(".slide").each(function() {
			// add the transition duration
			this.style[_.supportedCSSTransition + "-duration"] = _.settings.speed + "ms";
		});
	}

	/*
		Remove the CSS transition duration from the DOM Object's style property
		We trigger this function just after the slides have animated

		@params void

		@returns void
	*/
	HeroSlider.prototype.removeCSSDuration = function() {

		//
		var _ = this;

		//
		this.$carousel.find(".slide").each(function() {
			//
			this.style[_.supportedCSSTransition + "-duration"] = "";
		});
	}

	/*
	 	Executes the animation via JS transitions
	 	
	 	@params	object	nextSlide	Jquery object the next slide to slide into view
	 	@params	string	direction 	animation direction
	 
	 	@returns void
	 */
	HeroSlider.prototype._jsAnimation = function($nextSlide, direction) {
		
		// Cache this reference for use inside animate functions
		var _ = this;

		// animate the current slide
		this.$currentSlide.fadeIn(this.settings.speed);

		// animate the next slide
		$nextSlide.fadeOut(
			this.settings.speed,
			function() {
				//Get rid of any JS animation residue
				_.$currentSlide.removeClass("active js-reset-left").attr("style", "");
				//Cache the next slide after classes and inline styles have been removed
				_.$currentSlide = $nextSlide.removeClass("fade-in").attr("style", "");
				_.startTimer();
			});
	};

	/*
	 	Initialize the plugin once for each DOM object passed to jQuery
	 
	 	@params	object	options		Hero slider settings from user

	 	@returns void
	 */
	$.fn.HeroSlider = function(options) {

		// for each element specified 
		return this.each(function(index, element) {

			// create a new Hero Slider in the specified element
			element.HeroSlider = new HeroSlider(element, options);
		});
	};
})();

// Custom options for the carousel
var args = {
	// A jQuery reference to the right arrow
	arrowRight: ".arrow.next",
	// A jQuery reference to the left arrow 
	arrowLeft: ".arrow.previous", 
	// The speed of the animation (milliseconds)
	speed: 500, 
	// The amount of time between animations (milliseconds)
	slideDuration: 6000 
};

// create a new Hero slider in each of the elements
// found by the selector
$(".carousel").HeroSlider(args);
