<template lang="pug">
	input(ref="input" @input="update")
</template>
<style lang="scss">
</style>
<script>
	import {conformToMask, createTextMaskInputElement} from 'text-mask-core';

	class InputMaskManagerClass {
		constructor() {
			this._registeredMasks = {};
		}
		
		createMaskFromChar( char ) {
			if ( char === '#' )
				return /\d/;
			return char;
		}
		
		createMaskFromString( str ) {
			const mask = [];
			for ( let i = 0, len = str.length; i<len; ++i ) {
				mask.push( this.createMaskFromChar( str.charAt(i) ) );
			};
			return mask;
		}

		normalizeMask( mask, options ) {
			if ( typeof(mask) === 'string' ) {
				const args = mask.split( ":" );
				const maskName = args[0];
				if ( !this._registeredMasks[ maskName ] ) {
					if ( args.length > 1 )
						throw new Error( "Invalid mask " + mask );
					mask = this.createMaskFromString( mask );
					return function() { return mask; };
				}

				mask = this._registeredMasks[ maskName ];
				return function( value ) {
					args[0] = value;
					return mask.apply( this, args );
				};
			} else if ( typeof(mask) === 'function' ) {
				return function( value ) {
					return mask.call( this, value );
				};
			} else if ( Array.isArray( mask ) ) {
				return function() { return mask; };
			}
			throw new Error( "Invalid mask. Expected string, array or function for mask." );
		}
		
		applyMask( mask, value ) {
			mask = this.normalizeMask( mask );
			while ( mask ) {
				if ( typeof(mask) !== 'function' )
					break;
				mask = mask( value );
				if ( mask.value != null ) {
					value = mask.value;
					mask  = mask.mask;
				}
			}
			if ( mask == null )
				return value;
			const results = conformToMask( value, mask );
			return results.conformedValue;
		}
		
		registerMask( name, mask, options ) {
			this._registeredMasks[ name ] = this.normalizeMask( mask, options );
		}

		getMask( name ) {
			return this._registeredMasks[ name ];
		}

		instance() {
			return new InputMaskManagerClass;
		}
	};

	export const InputMaskManager = new InputMaskManagerClass;
	InputMaskManager.registerMask( 'cpf',  '###.###.###-##' );
	InputMaskManager.registerMask( 'cnpj', '##.###.###/####-##' );
	InputMaskManager.registerMask( 'cpfcnpj', function( value ) {
		value = value.replace( /[^\d+]/g, '' );
		return value.length >= 12 ? InputMaskManager.getMask( 'cnpj' ) : InputMaskManager.getMask( 'cpf' );
	});
	InputMaskManager.registerMask( 'money', function( value ) {
		const original = value;
		value	= value.replace( /[^\d+]/g, '' );
		value	= value.replace( /^0+/, '' );
		let len = value.length;
		let mask = null;
		if ( len <= 0 ) {
			value = original ? '0,00' : '';
			mask = null;
		} else if ( len <= 1 )
			mask = ['0', ',', '0', /\d/];
		else if ( len <= 2 )
			mask = ['0', ',', /\d/, /\d/];
		else if ( len <= 3 )
			mask = [/\d/, ',', /\d/, /\d/];
		else {
			const ret = [];
			let c = 0;
			for ( let i = 0, n = len-2; i<n; ++i ) {
				if ( c >= 3 ) {
					ret.push( '.' );
					c = 0;
				}
				ret.push( /\d/ );
				c += 1;
			}
			mask = ret.reverse().concat( [',', /\d/, /\d/] );
		}
		return { value, mask };

	});



	
	export default {
		props: {
			mask: {
				type:	  [String, Array, Function],
				required: true,
			},
			value: true,
		},
		InputMaskManager,
		computed: {
			processedMask() {
				return this.$options.InputMaskManager.normalizeMask( this.mask );
			},
		},
		watch: {
			value( v ) {
				this.update( v );
			},
		},
		created() {
			this.textMaskInput = createTextMaskInputElement();
		},
		mounted() {
			this.update( this.value );
		},
		methods: {
			update( value ) {
				value = ( value && value.target ) ? value.target.value : value;
				value = value||'';
				if ( typeof(value) === 'string' )
					void(0);
				else if ( typeof(value) === 'number' )
					value = ''+value;
				else
					throw new Error( "Value must be a string" );

				let processedMask = this.processedMask;
				while ( processedMask ) {
					if ( typeof(processedMask) !== 'function' )
						break;
					processedMask = processedMask( value );
					if ( processedMask.value != null ) {
						value = processedMask.value;
						processedMask = processedMask.mask;
					}
				}
				if ( processedMask == null ) {
					this.$refs.input.value = value;
				} else {
					const ret = this.textMaskInput.update( value, {
						inputElement: this.$refs.input,
						mask:		  processedMask,
						guide:		  false,
					});
				}
				this.$emit( 'input', this.$refs.input.value );
			},
		},
	};

</script>
