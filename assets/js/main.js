(function ($) {
	"use strict";

	$(window).on('load', function () {
		preloader();
		wowAnimation();
	});

	/*------------------------------------------
	= preloader
	-------------------------------------------*/
	function preloader() {
		$('#preloader').fadeOut('slow',function(){
			$(this).remove();
		});
	}

	gsap.config({
		nullTargetWarn: false,
	});
	
	/*------------------------------------------
	= back to top
	-------------------------------------------*/
	$(window).scroll(function () {
		if ($(this).scrollTop() > 500) {
			$('.xb-backtotop').addClass('active');
		} else {
			$('.xb-backtotop').removeClass('active');
		}
	});  
	$(function () {
		$(".scroll").on('click', function () {
			$("html,body").animate({ scrollTop: 0 }, "slow");
			return false
		});
	});

	 // Sticky Header - Start
	// --------------------------------------------------
	if ($('.stricky').length) {
		$('.stricky').addClass('original').clone(true).insertAfter('.stricky').addClass('stricked-menu').removeClass('original');
	}
	$(window).on('scroll', function () {
		if ($('.stricked-menu').length) {
		var headerScrollPos = 150;
		var stricky = $('.stricked-menu');
		if ($(window).scrollTop() > headerScrollPos) {
			stricky.addClass('stricky-fixed');
		} else if ($(this).scrollTop() <= headerScrollPos) {
			stricky.removeClass('stricky-fixed');
		}
		}
	});
	// Sticky Header - End

	/*------------------------------------------
	= header search
	-------------------------------------------*/
	$(".header-search-btn").on("click", function (e) {
		e.preventDefault();
		$(".header-search-form-wrapper").addClass("open");
		$('.header-search-form-wrapper input[type="search"]').focus();
		$('.body-overlay').addClass('active');
	});
	$(".xb-search-close").on("click", function (e) {
		e.preventDefault();
		$(".header-search-form-wrapper").removeClass("open");
		$("body").removeClass("active");
		$('.body-overlay').removeClass('active');
	});

	/*------------------------------------------
	= sidebar
	-------------------------------------------*/
	$('.sidebar-menu-close, .body-overlay').on('click', function () {
		$('.offcanvas-sidebar').removeClass('active');
		$('.body-overlay').removeClass('active');
	});

	$('.offcanvas-sidebar-btn').on('click', function () {
		$('.offcanvas-sidebar').addClass('active');
		$('.body-overlay').addClass('active');
	});
	$('.body-overlay').on('click', function () {
		$(this).removeClass('active');
		$(".header-search-form-wrapper").removeClass("open");
	});


	/*------------------------------------------
	= mobile menu
	-------------------------------------------*/
	$('.xb-nav-hidden li.menu-item-has-children > a').append('<span class="xb-menu-toggle"></span>');
	$('.xb-header-menu li.menu-item-has-children, .xb-menu-primary li.menu-item-has-children').append('<span class="xb-menu-toggle"></span>');
	$('.xb-menu-toggle').on('click', function () {
		if (!$(this).hasClass('active')) {
			$(this).closest('ul').find('.xb-menu-toggle.active').toggleClass('active');
			$(this).closest('ul').find('.sub-menu.active').toggleClass('active').slideToggle();
		}
		$(this).toggleClass('active');
		$(this).closest('.menu-item').find('> .sub-menu').toggleClass('active');
		$(this).closest('.menu-item').find('> .sub-menu').slideToggle();
	});

	$('.xb-nav-hidden li.menu-item-has-children > a').click(function (e) {
		var target = $(e.target);
		if ($(this).attr('href') === '#' && !(target.is('.xb-menu-toggle'))) {
			e.stopPropagation();
			if (!$(this).find('.xb-menu-toggle').hasClass('active')) {
				$(this).closest('ul').find('.xb-menu-toggle.active').toggleClass('active');
				$(this).closest('ul').find('.sub-menu.active').toggleClass('active').slideToggle();
			}
			$(this).find('.xb-menu-toggle').toggleClass('active');
			$(this).closest('.menu-item').find('> .sub-menu').toggleClass('active');
			$(this).closest('.menu-item').find('> .sub-menu').slideToggle();
		}
	});
	$(".xb-nav-mobile").on('click', function () {
		$(this).toggleClass('active');
		$('.xb-header-menu').toggleClass('active');
	});

	$(".xb-menu-close, .xb-header-menu-backdrop").on('click', function () {
		$(this).removeClass('active');
		$('.xb-header-menu').removeClass('active');
	});

	/*------------------------------------------
	= nice select
	-------------------------------------------*/
	$('select').niceSelect();

	/*------------------------------------------
	= data background and bg color
	-------------------------------------------*/
	$("[data-background]").each(function () {
		$(this).css("background-image", "url(" + $(this).attr("data-background") + ") ")
	})
	$("[data-bg-color]").each(function () {
		$(this).css("background-color", $(this).attr("data-bg-color"));

	});


	/*------------------------------------------
	= aos animation
	-------------------------------------------*/
	function wowAnimation() {
		var wow = new WOW({
			boxClass: 'wow',
			animateClass: 'animated',
			offset: 0,
			mobile: false,
			live: true
		});
		wow.init();
	}


	/*------------------------------------------
	= counter
	-------------------------------------------*/
	if ($(".xbo").length) {
		$('.xbo').appear();
		$(document.body).on('appear', '.xbo', function (e) {
			var odo = $(".xbo");
			odo.each(function () {
				var countNumber = $(this).attr("data-count");
				$(this).html(countNumber);
			});
			window.xboOptions = {
				format: 'd',
			};
		});
	}

	if ($(".xbo_trigger").length) {
        var odo = $(".xbo_trigger");
        odo.each(function () {
            var countNumber = $(this).attr("data-count");
            var odometerInstance = new Odometer({
                el: this,
                value: 0,
                format: 'd',
            });
            odometerInstance.render();
            odometerInstance.update(countNumber);
        });
        $('.xbo_trigger').appear();
        $(document.body).on('appear', '.xboh', function (e) {
            // This event handler can be empty or used for additional functionality if needed
        });
    }

	/*------------------------------------------
	= isotop
	-------------------------------------------*/
	if ($.fn.imagesLoaded && $('.grid').length > 0) {
		$('.grid').imagesLoaded(function () {
			var $grid = $('.grid').isotope({
				itemSelector: '.grid-item',
				percentPosition: true,
				masonry: {
					// use outer width of grid-sizer for columnWidth
					columnWidth: '.grid-item',
				}
			});

			// filter items on button click
			$('.portfolio-menu').on('click', 'button', function () {
				var filterValue = $(this).attr('data-filter');
				$grid.isotope({ filter: filterValue });
			});
		});
	}

	//for menu active class
	$('.portfolio-menu button').on('click', function (event) {
		$(this).siblings('.active').removeClass('active');
		$(this).addClass('active');
		event.preventDefault();
	});

	/*------------------------------------------
	= Background Parallax - Start
	-------------------------------------------*/
	$('.parallaxie').parallaxie({
		speed: 0.5,
		offset: 0,
	});


	/*------------------------------------------
	= work slide
	-------------------------------------------*/
	var slider = new Swiper(".xb-testimonial-slider", {
		loop: true,
		spaceBetween: 30,
		speed: 400,
		slidesPerView: 4,
		centeredSlides: false,
		autoplay: {
			enabled: true,
			delay: 6000
		},
		navigation: {
			nextEl: ".swiper-button-next",
			prevEl: ".swiper-button-prev",
		},
		breakpoints: {
			'1600': {
				slidesPerView: 4,
			},
			'1200': {
				slidesPerView: 3,
			},
			'1024': {
				slidesPerView: 2,
			},
			'768': {
				slidesPerView: 2,
			},
			'576': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},
	});
	/*------------------------------------------
	= team slide
	-------------------------------------------*/
	var slider = new Swiper(".dc-team-slider", {
		loop: true,
		speed: 400,
		spaceBetween: 0,
		slidesPerView: 7,
		centeredSlides: false,
		autoplay: {
			enabled: true,
			delay: 6000
		},
		pagination: {
			el: ".swiper-pagination",
		},
		navigation: {
			nextEl: ".swiper-button-next",
			prevEl: ".swiper-button-prev",
		},
		breakpoints: {
			'1600': {
				slidesPerView: 7,
			},
			'1024': {
				slidesPerView: 5,
			},
			'768': {
				slidesPerView: 5,
			},
			'576': {
				slidesPerView: 1,
				spaceBetween: 20,
			},
			'0': {
				slidesPerView: 1,
			},
		},
	});
	/*------------------------------------------
	= testimonial slide
	-------------------------------------------*/
	var slider = new Swiper(".dc-testimonial-slider", {
		loop: true,
		speed: 400,
		spaceBetween: 20,
		slidesPerView: 5,
		centeredSlides: false,
		autoplay: {
			enabled: true,
			delay: 6000
		},
		breakpoints: {
			'1600': {
				slidesPerView: 5,
			},
			'1366': {
				slidesPerView: 4,
			},
			'992': {
				slidesPerView: 3,
			},
			'768': {
				slidesPerView: 2,
				spaceBetween: 40,
			},
			'576': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},
	});
	/*------------------------------------------
	= testimonial slide
	-------------------------------------------*/
	var slider = new Swiper(".fa-team-slider", {
		loop: true,
		speed: 400,
		spaceBetween: 100,
		slidesPerView: 5,
		centeredSlides: false,
		autoplay: {
			enabled: true,
			delay: 6000
		},
		breakpoints: {
			'1600': {
				slidesPerView: 5,
				
			},
			'1024': {
				slidesPerView: 4,
				spaceBetween: 50,
			},
			'768': {
				slidesPerView: 3,
				spaceBetween: 50,
			},
			'576': {
				slidesPerView: 2,
				spaceBetween: 50,
			},
			'400': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},
	});
	/*------------------------------------------
	= testimonial slide
	-------------------------------------------*/
	var slider = new Swiper(".blog-slider", {
		loop: true,
		speed: 400,
		spaceBetween: 20,
		slidesPerView: 1,
		centeredSlides: false,
		autoplay: {
			enabled: true,
			delay: 6000
		},
		pagination: {
			el: ".swiper-pagination",
		},
		navigation: {
			nextEl: ".swiper-button-next",
			prevEl: ".swiper-button-prev",
		},
		breakpoints: {
			'1600': {
				slidesPerView: 1,
			},
			'768': {
				slidesPerView: 1,
			},
			'576': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},
	});

	/*------------------------------------------
	= inhover active
	-------------------------------------------*/
	$(".xb-mouseenter").on('mouseenter', function () {
		$(".xb-mouseenter").removeClass("active");
		$(this).addClass("active");
	});
	$(".xb-mouseenter2").on('mouseenter', function () {
		$(".xb-mouseenter2").removeClass("active");
		$(this).addClass("active");
	});

	/*------------------------------------------
	= click button active
	-------------------------------------------*/
	$(function () {
		$('.category li').on('click', function () {
			var active = $('.category li.active');
			active.removeClass('active');
			$(this).addClass('active');
		});
	});

	/*------------------------------------------
	= click button active
	-------------------------------------------*/
	document.addEventListener("DOMContentLoaded", function () {
		const hilightText = document.querySelectorAll('.hilight-text');
		let current = 0;

		if (hilightText.length > 0) {
		setInterval(() => {
			hilightText.forEach(box => box.classList.remove('active'));
			hilightText[current].classList.add('active');
			current = (current + 1) % hilightText.length;
		}, 2000);
		}
	});

	/*------------------------------------------
	= magnificPopup
	-------------------------------------------*/
	$('.popup-image').magnificPopup({
		type: 'image',
		gallery: {
			enabled: true
		}
	});
	$('.popup-video').magnificPopup({
		type: 'iframe',
		mainClass: 'mfp-zoom-in',
	});

	/*------------------------------------------
	= Accordion Box
	-------------------------------------------*/
	if ($(".accordion_box").length) {
		$(".accordion_box").on("click", ".acc-btn", function () {
			var outerBox = $(this).parents(".accordion_box");
			var target = $(this).parents(".accordion");

			if ($(this).next(".acc_body").is(":visible")) {
				$(this).removeClass("active");
				$(this).next(".acc_body").slideUp(300);
				$(outerBox).children(".accordion").removeClass("active-block");
			} else {
				$(outerBox).find(".accordion .acc-btn").removeClass("active");
				$(this).addClass("active");
				$(outerBox).children(".accordion").removeClass("active-block");
				$(outerBox).find(".accordion").children(".acc_body").slideUp(300);
				target.addClass("active-block");
				$(this).next(".acc_body").slideDown(300);
			}
		});
	}
	

	/*------------------------------------------
	= marquee
	-------------------------------------------*/
	$('.marquee-left').marquee({
		speed: 10,
		gap: 0,
		delayBeforeStart: 0,
		direction: 'left',
		duplicated: true,
		pauseOnHover: false,
		startVisible: true,
	});	
	$('.marquee-right').marquee({
		speed: 20,
		gap: 0,
		delayBeforeStart: 0,
		direction: 'right',
		duplicated: true,
		pauseOnHover: false,
		startVisible: true,
	});	

	/*----------------------------
	= countdown
    ------------------------------ */
	$('[data-countdown]').each(function () {
		var $this = $(this),
			finalDate = $(this).data('countdown');
		if (!$this.hasClass('countdown-full-format')) {
			$this.countdown(finalDate, function (event) {
				$this.html(event.strftime('<div class="single"><h1>%D</h1><p>Days</p></div><div class="single"><h1>%H</h1><p>Hours</p></div><div class="single"><h1>%M</h1><p>Minutes</p></div><div class="single"><h1>%S</h1><p>SECONDS</p></div>'));
			});
		} else {
			$this.countdown(finalDate, function (event) {
				$this.html(event.strftime('<div class="single"><h1>%Y</h1><p>Years</p></div><div class="single"><h1>%m</h1><p>Months</p></div><div class="single"><h1>%W</h1><p>Weeks</p></div><div class="single"><h1>%d</h1><p>Days</p></div><div class="single"><h1>%H</h1><p>Hours</p></div><div class="single"><h1>%M</h1><p>Minutes</p></div><div class="single"><h1>%S</h1><p>SECONDS</p></div>'));
			});
		}
	});

	/*----------------------------
	= parallax-icon
    ------------------------------ */
	document.addEventListener("mousemove", (e) => {
		const items = document.querySelectorAll(".img");
		const centerX = window.innerWidth / 2;
		const centerY = window.innerHeight / 2;

		items.forEach(item => {
			const speed = item.getAttribute("data-speed");
			const x = (e.clientX - centerX) * speed / 100;
			const y = (e.clientY - centerY) * speed / 100;
			item.style.transform = `translate(${x}px, ${y}px)`;
		});
	});

	
	/*------------------------------------------
	= trigger (line)
	-------------------------------------------*/
	gsap.registerPlugin(ScrollTrigger);
	$('.xb_trigger').each(function () {
		gsap.to(this, {
			scrollTrigger: {
				trigger: this,
				start: "top 120%",
			},
			onComplete: function() {
				this.targets().forEach(function(target) {
					target.classList.add('triggered');
				});
			}
		});
	});

	
	/*------------------------------------------
	= element parallax (button)
	-------------------------------------------*/
	$('.xb-element-parallax').each(function () {
        var $this = $(this);
        var dampingFactor = 0.5;

        function handleMouseMove(e) {
            var offset = $this.offset();
            var mouseX = e.pageX - offset.left;
            var mouseY = e.pageY - offset.top;
            var translateX = (mouseX - $this.width() / 2) * dampingFactor;
            var translateY = (mouseY - $this.height() / 2) * dampingFactor;

            var translateTransform = 'translate(' + translateX + 'px, ' + translateY + 'px)';
            $this.css({
                'transform': translateTransform,
                'transition': 'transform 0.1s ease-out'  // Adjust the duration and easing as needed
            });
        }

        function resetTransform() {
            $this.css({
                'transform': 'none',
                'transition': 'transform 0.3s ease-out'  // Adjust the duration and easing as needed
            });
        }

        if ($this.closest('.xb-parent-element-parallax').length) {
            var pare2 = $this.closest('.xb-parent-element-parallax');
            pare2.mousemove(function (e) {
                handleMouseMove(e);
            });
            pare2.mouseleave(resetTransform);
        } else {
            $this.mousemove(handleMouseMove);
            $this.mouseleave(resetTransform);
        }
    });

	/*----------------------------
	= SHOP PRICE SLIDER
    ------------------------------ */
	if($("#slider-range").length) {
		$("#slider-range").slider({
			range: true,
			min: 10,
			max: 200,
			values: [0, 140],
			slide: function(event, ui) {
				$("#amount").val("$" + ui.values[0] + " - $" + ui.values[1]);
			}
		});

		$("#amount").val("$" + $("#slider-range").slider("values", 0) + " - $" + $("#slider-range").slider("values", 1));
	}
	
	
	/*------------------------------------------
    = TOUCHSPIN FOR PRODUCT SINGLE PAGE
    -------------------------------------------*/
	if ($("input.product-count").length) {
		$("input.product-count").TouchSpin({
			min: 1,
			max: 1000,
			step: 1,
			buttondown_class: "btn btn-link",
			buttonup_class: "btn btn-link",
		});
	} 

	/*------------------------------------------
    = woocommerce
    -------------------------------------------*/
    if($(".checkout-section").length) {
        var showLogInBtn = $(".woocommerce-info > a");
        var showCouponBtn = $(".showcoupon");
        var shipDifferentAddressBtn = $("#ship-to-different-address");
        var loginForm = $("form.login");
        var couponForm = $(".checkout_coupon");
        var shippingAddress = $(".shipping_address");

        loginForm.hide();
        couponForm.hide();
        shippingAddress.hide();

        showLogInBtn.on("click", function(event) {
            event.preventDefault();
            loginForm.slideToggle();
            event.stopPropagation();
        });

        showCouponBtn.on("click", function(event2) {
            event2.preventDefault();
            couponForm.slideToggle();
            event2.stopPropagation();
        })

        shipDifferentAddressBtn.on("click", function(event3) {
            shippingAddress.slideToggle();
            event3.stopPropagation();
        })
    }

	
})(jQuery);


