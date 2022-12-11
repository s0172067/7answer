; (function () {
	'use strict';

	class Gallery {
		
		static defaults = {
			margin: 10,		
			visibleItems: 1,		
			border: 0,		
			responsive: true,	
			autoScroll: false,	
			interval: 3000,	
			nav: true,	
			dots: false,	
			keyControl: false,	
			animated: false,	
			baseTransition: 0.4,	
			delayTimer: 250,	
			limit: 30		
		};
		static LEFT = 37;	 
		static RIGHT = 39;	

		constructor(gallery, setup) {
			this.gallery = gallery;
			this.setup = setup;

			
			this.slider = this.gallery.querySelector('.slider');
			
			this.stage = this.gallery.querySelector('.stage');
			this.items = this.gallery.querySelectorAll('.stage > div');
			this.count = this.items.length;

			this.current = 0;		
			this.next = 0;			
			this.pressed = false;	
			this.start = 0;			
			this.shift = 0;			

			this.init();
		}

		static extend(out) {
			out = out || {};
			for (let i = 1; i < arguments.length; i++) {
				if (!arguments[i]) continue;
				for (let key in arguments[i]) {
					if (arguments[i].hasOwnProperty(key)) out[key] = arguments[i][key];
				}
			}
			return out;
		};

		static xpos(e) {
			if (e.targetTouches && (e.targetTouches.length >= 1)) {
				return e.targetTouches[0].clientX;
			}
			return e.clientX;
		}

		init() {
			this.options = Gallery.extend({}, Gallery.defaults, this.setup);
			this.setSizeCarousel();
			this.setCoordinates();
			this.initControl();
			if (this.events) return;
			this.registerEventsHandler();
		}

		setSizeCarousel() {
			this.widthSlider = this.slider.offsetWidth;

			if (this.options.responsive) this.setAdaptiveOptions();

			this.max = this.count - this.options.visibleItems;

			const width = (this.widthSlider - this.options.margin * (this.options.visibleItems - 1)) / this.options.visibleItems;

			this.width = width + this.options.margin;
			this.widths = this.width * this.count;
			this.stage.style.width = this.widths + 'px';
			for (let item of this.items) {
				item.style.cssText = `width:${width}px; margin-right:${this.options.margin}px;`;
			}

			setTimeout(() => { this.gallery.style.visibility = 'visible' }, 350);
		}

		setCoordinates() {
			let point = 0;
			this.coordinates = [];

			while (this.coordinates.length < this.count) {
				this.coordinates.push(point);
				point -= this.width;
			}
		}

		initControl() {
			this.navCtrl = this.gallery.querySelector('.nav-ctrl');
			this.dotsCtrl = this.gallery.querySelector('.dots-ctrl');

			if (this.options.nav === true) {
				this.btnPrev = this.navCtrl.querySelector('[data-shift=prev]');
				this.btnNext = this.navCtrl.querySelector('[data-shift=next]');
				this.setNavStyle();
				this.navCtrl.dataset.hidden = false;
			} else {
				this.navCtrl.dataset.hidden = true;
			}

			if (this.options.dots === true) {
				this.creatDotsCtrl();
				this.dotsCtrl.dataset.hidden = false;
			} else {
				this.dotsCtrl.dataset.hidden = true;
			}
		}

		setAdaptiveOptions() {
			const width = document.documentElement.clientWidth;
			const points = [];
			let point;

			for (let key in this.options.adaptive) {
				points.push(key);
			}

			for (let i = 0, j = points.length; i < j; i++) {
				let a = points[i],
					b = (points[i + 1] !== undefined) ? points[i + 1] : points[i];

				if (width <= points[0]) {
					point = points[0];
				} else if (width >= a && width < b) {
					point = a;
				} else if (width >= points[points.length - 1]) {
					point = points[points.length - 1];
				}
			}

			const setting = this.options.adaptive[point];
			for (let key in setting) {
				this.options[key] = setting[key];
			}
		}

		setNavStyle() {
			this.btnPrev.classList.remove('disable');
			this.btnNext.classList.remove('disable');

			if (this.current == 0) {
				this.btnPrev.classList.add('disable');
			} else if (this.current >= this.count - this.options.visibleItems) {
				this.btnNext.classList.add('disable');
			}
		}

		creatDotsCtrl() {
			this.spots = [];
			this.dotsCtrl.innerHTML = '';

			const li = document.createElement('li');
			let i = 0, point = 0, clone;

			while (i < this.count) {
				clone = li.cloneNode(true);
				this.dotsCtrl.appendChild(clone);
				this.spots.push(clone);

				i += this.options.visibleItems;
				point = (i <= this.max) ? point - this.width * this.options.visibleItems : -this.width * this.max;
			}
			this.setDotsStyle();
		}

		setDotsStyle() {
			for (let spot of this.spots) {
				spot.classList.remove('active');
			}
			const i = (this.next < this.max) ? Math.trunc(this.next / this.options.visibleItems) : this.spots.length - 1;
			this.spots[i].classList.add('active');
		}

		registerEventsHandler(e) {
			window.addEventListener('resize', this.resize.bind(this));
			if (this.options.autoScroll) {
				setInterval(() => this.autoScroll(), this.options.interval);
			}
			this.navCtrl.addEventListener('click', this.navControl.bind(this));
			this.dotsCtrl.addEventListener('click', this.dotsControl.bind(this));
			if (this.options.keyControl) {
				window.addEventListener('keydown', this.keyControl.bind(this));
			}
			this.gallery.querySelector('.slider').addEventListener('click', this.showPhoto.bind(this));

			this.gallery.querySelector('.slider').addEventListener('wheel', this.wheelControl.bind(this));

			this.stage.addEventListener('mousedown', this.tap.bind(this));
			this.stage.addEventListener('mousemove', this.drag.bind(this));
			this.stage.addEventListener('mouseup', this.release.bind(this));
			this.stage.addEventListener('mouseout', this.release.bind(this));

			this.stage.addEventListener('touchstart', this.tap.bind(this));
			this.stage.addEventListener('touchmove', this.drag.bind(this));
			this.stage.addEventListener('touchend', this.release.bind(this));

			this.events = true;
		}

		resize() {
			clearTimeout(this.resizeTimer);
			this.resizeTimer = setTimeout(() => {
				this.init();
				this.current = (this.current <= this.max) ? this.current : this.max;
				let x = this.coordinates[this.current];
				this.scroll(x, this.options.baseTransition);
			}, this.options.delayTimer);
		}

		autoScroll(e) {
			const x = this.getNextCoordinates(1);
			this.scroll(x, this.options.baseTransition);
		}

		navControl(e) {
			if (e.target.tagName != 'SPAN') return;
			const d = (e.target.dataset.shift === 'next') ? 1 : -1;
			const x = this.getNextCoordinates(d);
			this.scroll(x, this.options.baseTransition);
		}

		dotsControl(e) {
			if (e.target.tagName != 'LI' || e.target.classList.contains('active')) return;

			const i = this.spots.indexOf(e.target);
			if (i == -1) return;

			this.next = i * this.options.visibleItems;
			this.next = (this.next <= this.max) ? this.next : this.max;
			const x = this.coordinates[this.next];
			const n = Math.abs(this.current - this.next);
			const t = this.options.baseTransition + n * 0.07;

			this.scroll(x, t);
		}

		keyControl(e) {
			if (e.which !== Gallery.RIGHT && e.which !== Gallery.LEFT) return;
			const d = (e.which === Gallery.RIGHT) ? 1 : -1;
			const x = this.getNextCoordinates(d);
			this.scroll(x, this.options.baseTransition);
		}

		wheelControl(e) {
			e.preventDefault();
			const d = (e.deltaY > 0) ? 1 : -1;
			const x = this.getNextCoordinates(d);
			this.scroll(x, this.options.baseTransition);
		}

		//tap(e) {
		//	e.preventDefault();
		//	e.stopPropagation();
		//	if (event.which && event.which != 1) return;
		//	this.start = Gallery.xpos(e);
		//	this.pressed = true;
		//}

		drag(e) {
			e.preventDefault();
			e.stopPropagation();

			if (this.pressed === false) return;

			this.shift = this.start - Gallery.xpos(e);
			if (Math.abs(this.shift) < 3) return;

			const remaining = this.widths - this.width * this.options.visibleItems;
			const delta = this.coordinates[this.current] - this.shift;
			if (delta > this.options.limit || Math.abs(delta) - remaining > this.options.limit) return;

			this.scroll(delta, 0);
		}

		release(e) {
			e.preventDefault();
			e.stopPropagation();

			if (this.pressed === false) return;

			const d = (Math.abs(this.shift) > this.width / 2) ? Math.round(this.shift / this.width) : '';
			const x = this.getNextCoordinates(d);

			this.scroll(x, this.options.baseTransition);
			this.pressed = false;
		}

		showPhoto(e) {
			let target = e.target;
			if (target.tagName != 'IMG') return;
		}

		getNextCoordinates(direction) {
			if (typeof (direction) !== 'number') return this.coordinates[this.current];

			if (this.options.autoScroll && this.current >= this.count - this.options.visibleItems) {
				this.next = 0;
			} else {
				if (this.current == 0 && direction == -1 ||
					(this.current >= this.max) && direction == 1) return;
				this.next += direction;
			}
			return this.coordinates[this.next];
		}

		scroll(x, transition) {
			if (typeof (x) !== 'number') return;

			this.stage.style.cssText = `width:${this.widths}px; height:${this.items[0].offsetHeight}px; transform:translateX(${x}px); transition:${transition}s`;
			this.current = (this.next < this.max) ? this.next : this.max;

			if (this.options.nav) this.setNavStyle();
			if (this.options.dots) this.setDotsStyle();
		}
	}

	const galleries = document.querySelectorAll('.gallery');
	for (let gallery of galleries) {
		const setup = gallery.dataset.setting;
		const slider = new Gallery(gallery, setting[setup]);
	}
})();