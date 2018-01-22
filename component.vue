<style lang="scss">
	.vue-ripple-container {
		position: relative;
		overflow: hidden;
		-webkit-mask-image: -webkit-radial-gradient(circle, white, black);
	}

	.vue-ripple {
		position: absolute;
		pointer-events: none;
		user-select: none;

		top: 0;
		left: 0;
		width: 0;
		height: 0;
		background-color: currentColor;
		opacity: 0.2;
		border-radius: 100%;

		transition: transform 0.4s ease-out, opacity 0.4s ease-out;
		transform:  scale(0);
		//transform-origin: center center;

		&.vue-ripple--active {
			opacity: 0.4;
			transform: scale(1);
		}
		&.vue-ripple--active.vue-ripple--clear {
			opacity: 0;
		}
	}
</style>
<script>
const ID = "has_ripple";
export class Ripple {
	constructor() {
		this._activeRipples = [];
	}


	createDirective() {
		return {
			inserted( el ) {
				el.dataset[ ID ] = "ripple";
				el.classList.toggle( "vue-ripple-container", true );
			},
			componentUpdated( el ) {
				el.dataset[ ID ] = "ripple";
				el.classList.toggle( "vue-ripple-container", true );
			},
		};
	}

	start( element, x, y ) {
		const ripple = document.createElement( "span" );
		ripple.className = "vue-ripple";
		this._activeRipples.push( ripple );


		const rect = element.getBoundingClientRect();
		const size = Math.ceil( Math.sqrt(rect.width * rect.width + rect.height * rect.height) );

		ripple.style.width  = `${size * 2}px`;
		ripple.style.height = `${size * 2}px`;
		ripple.style.marginLeft = `${-size + x}px`;
		ripple.style.marginTop  = `${-size + y}px`;

		element.insertBefore( ripple, element.childNodes[0] );
		window.setTimeout( () => {
			ripple.classList.add( "vue-ripple--active" );
		}, 0 );
	}

	startFromEvent( event, type ) {
		const element = event.target;
		if ( !element.dataset[ ID ] )
			return;

		const now = Date.now();
		if ( element.dataset[ ID+"_type" ] && type ) {
			const time = parseInt( element.dataset[ ID+"_timestamp" ], 10 );
			if ( ( ( now - time ) < 1000 ) && ( element.dataset[ ID+"_type" ] !== type ) )
				return;
		}
		
		element.dataset[ ID+"_type" ] = type;
		element.dataset[ ID+"_timestamp" ] = now;

		let x, y;
		if ( event.offsetX != null ) {
			x = event.offsetX;
			y = event.offsetY;
		} else {
			x = event.clientX - element.offsetLeft;
			y = event.clientY - element.offsetTop;
		}
		this.start( element, x, y );
	}

	clear() {
		if ( !this._activeRipples || this._activeRipples.length <= 0 )
			return;
		
		const ripples = this._activeRipples;
		this._activeRipples = [];

		for ( let i = 0, len = ripples.length; i<len; ++i )
			ripples[i].classList.add( "vue-ripple--clear" );

		window.setTimeout( () => {
			for ( let i = 0, len = ripples.length; i<len; ++i )
				ripples[i].parentNode.removeChild( ripples[i] );
		}, 600 );
	}


	static install( vue ) {
		const ripple = new Ripple;
		vue.directive( "ripple", ripple.createDirective() );
		vue.prototype.$ripple = ripple;

		document.addEventListener( 'mousedown', function( ev ) {
			if ( ev.button == 0 )
				ripple.startFromEvent( ev, ev.type );
		});
		document.addEventListener( 'touchstart', function( ev ) {
			for ( let i = 0; i < ev.changedTouches.length; ++i )
				ripple.startFromEvent( ev.changedTouches[i], ev.type );
		});
		document.addEventListener( 'mouseup', function( ev ) {
			ripple.clear();
		});
		document.addEventListener( 'touchend', function( ev ) {
			ripple.clear();
		});
		document.addEventListener( 'dragend', function( ev ) {
			ripple.clear();
		});
		document.addEventListener( 'dragleave', function( ev ) {
			ripple.clear();
		});
	}
};

// Default export
export default {};
</script>
