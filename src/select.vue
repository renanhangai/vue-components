<template lang="pug">
div.vue-select(role="combobox" :class="selectClass" ref="select" @blur.capture="onBlur" @keydown="onKeyDown")

	div.vue-select__value-container(
		ref="valueContainer" 
		:class="valueContainerClass" 
		:tabindex="disabled ? false : 0"
		@mousedown="onContainerClick" 
		:data-placeholder="placeholder || '\xa0'") {{valueText}}
		
	div.vue-select__dropdown-container(:style="{ 'z-index': zIndex }")
		.vue-select__search-container(v-if="search")
			input.vue-select__search(ref="input" :class="inputClass" v-model="searchTextValue")
		input.vue-select__search-hidden(v-else ref="input")

		slot(v-if="itemList === null" name="searching")
			div.vue-select__placeholder-text.vue-select__placeholder-searching Carregando
		slot(v-else-if="typeof itemList === 'string'" name="message" :message="itemList")
			div.vue-select__placeholder-text.vue-select__placeholder-message {{itemList}}
		slot(v-else-if="itemListFiltered.length <= 0" name="empty")
			div.vue-select__placeholder-text.vue-select__placeholder-empty Não foram encontrados resultados
		ul.vue-select__list(v-else @click.capture="onMenuClick")
			li.vue-select__list-item(v-for="item in itemListFiltered" tabindex="-1" :data-item-id="item.id" :key="item.id" :class="getItemClass(item)")
				slot(name="option" :item="item.value" :text="item.text")
					| {{item.text}}


</template>
<style lang="scss">
.vue-select {
	position: relative;


	.vue-select__value-container {
		position: relative;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
		cursor: default;
		
		&:empty:before {
			content: attr(data-placeholder);
			color: #888;
		}
		&:after {
			content: "";
			position: absolute;
			top: 0;
			right: 0;
			left: 0;
			bottom: 0;
			pointer-events: none;
			appearance: menulist;
		}
	}
	
	
	.vue-select__dropdown-container {
		display: none;
		
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		overflow: hidden;

		z-index: 1;
		max-height: 196px;
		overflow-y: auto;
	}
	.vue-select__search-container {
		padding: 0.5rem 8px 1rem;
		input { width: 100%; }
	}
	.vue-select__search-hidden {
		position: absolute;
		top: -100px;
	}
	.vue-select__list {
		margin-bottom: 0;
		padding-left: 0;
		.vue-select__list-item { 
			display: block; 
			padding: 0.25rem 32px 0.25rem 8px;
			&:hover, &:focus {
				background-color: #f0f0f0;
				cursor: pointer;
			}

			&.vue-select__list-item--selected {
				position: relative;
				font-weight: bold;
				&:after {
					color: #555;
					content: "";
					background: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMjAuMjg1IDJsLTExLjI4NSAxMS41NjctNS4yODYtNS4wMTEtMy43MTQgMy43MTYgOSA4LjcyOCAxNS0xNS4yODV6Ii8+PC9zdmc+);
					display: inline-block;
					position: absolute;
					right: 8px;
					top: 0.5rem;
					width: 1rem;
					height: 1rem;
					background-repeat: no-repeat;
					background-size: contain;
				}
			}
		}
	}
	.vue-select__placeholder-text {
		color: #888;
		padding: 0.25rem 8px;
	}
		

	// Styles when active
	&.vue-select--dropdown-active {
		.vue-select__dropdown-container { display: block; }
	}
	&.vue-select--disabled {
		.vue-select__value-container { 
			background-color: #e9ecef;
			opacity: 1;	
		 }
	}




	// Themes
	&.vue-select--default {
		.vue-select__value-container {
			padding: 0.25rem 8px;
			line-height: 1.5rem;
			border: 1px solid #ccc;
		}
		.vue-select__dropdown-container {
			border: 1px solid #ccc;
			border-top: none;
		}
	}
	&.vue-select--bootstrap4 {

		&.vue-select--dropdown-active {
			.vue-select__value-container {
				border-bottom-left-radius: 0;
				border-bottom-right-radius: 0;
			}
		}
		.vue-select__value-container {
			padding-left: 16px;
		}
		
		.vue-select__dropdown-container {
			background-color: #fff;
			border: 1px solid #ccc;
			border-top: none;
			border-bottom-left-radius: 0.25rem;
			border-bottom-right-radius: 0.25rem;
		}
	}
};
</style>
<script>
import Fuse from 'fuse.js';

import _debounce from 'lodash.debounce';

const Select = {
	mode: () => 'default',
	props: {
		value: true,
		items: true,
		mode:  String,
		disabled: Boolean,
		disabledText: String,
		placeholder: String,
		multiple: { type: [Boolean, Number], default: false },

		search: { type: Boolean, default: true },
		filter: { type: [Boolean, String, Array], default: true },
		fuse: Object,

		// Meta data
		meta: Object,
		
		// Style options
		zIndex: Number,
	},
	data() {
		return {
			dropdownActive: false,

			searchTextValue: "",

			itemList: null,
			itemMap:  {},

			selectedItemList: [],
			selectedItemMap: {},
		};
	},
	computed: {
		selectMode() {
			let mode = this.mode || this.$options.mode;
			if ( typeof mode === 'function' )
				mode = mode();
			return mode;
		},
		selectClass() {
			return {
				'vue-select--disabled': this.disabled,
				'vue-select--dropdown-active': this.dropdownActive,
				'vue-select--default': ( this.selectMode === 'default' ),
				'vue-select--foundation6': ( this.selectMode === 'foundation6' ),
				'vue-select--bootstrap4': ( this.selectMode === 'bootstrap4' ),
			};
		},
		valueContainerClass() {
			return {
				'custom-select': (this.selectMode === 'bootstrap4'),
				'form-control': (this.selectMode === 'bootstrap3'),
			};
		},
		inputClass() {
			return {
				'form-control': (this.selectMode === 'bootstrap4') || (this.selectMode === 'bootstrap3'),
			};
		},
		fuseFilter() {
			if ( this.filter === false )
				return null;

			const keys = this.filter === true ? [ 'text' ] : (typeof this.filter === 'string') ? [ 'text', this.filter ] : this.filter;

			const options = Object.assign( { 
				keys, 
				shouldSort: true,
			}, this.fuse );
			const fuse = new Fuse( this.itemListComplete, options );
			return Object.freeze({ fuse: fuse });
		},
		itemListFiltered() {
			if ( !this.fuseFilter || !this.searchTextValue )
				return this.itemListComplete;
				
			const results = this.fuseFilter.fuse.search( this.searchTextValue );
			return Object.freeze( results );
		},

		itemListComplete() {
			const itemsUnknown = [];
			for ( const id in this.selectedItemMap ) {
				if ( !this.itemMap[id] )
					itemsUnknown.push( this.selectedItemMap[id] );
			}
			if ( itemsUnknown.length <= 0 )
				return this.itemList;
			return Object.freeze( itemsUnknown.concat( this.itemList ) );
		},


		valueText() {
			if ( this.disabled && this.disabledText !== null )
				return this.disabledText;
			if ( this.selectedItemList.length <= 0 )
				return "";
			return this.selectedItemList.map( ( item ) => this.getItemShortText( item ) ).join( ", " );
		},
	},
	created() {
		this.setItemListDebounced = _debounce( this.setItemList, 250 );
		this.setItemList( this.items );

		this.setValue( this.value );
	},
	methods: {
		selectItem( item, refreshInput ) {
			if ( typeof(item) !== 'object' || !item.$vueSelectNormalized )
				item = this.normalizeItem( item );
				
			if ( this.multiple !== false ) {
				const list = [];
				const map = Object.assign( {}, this.selectedItemMap );
				map[item.id] = item;
				for ( const id in map )
					list.push( map[id] );

				this.selectedItemList = Object.freeze( list );
				this.selectedItemMap  = Object.freeze( map );
			} else {
				const list = [item];
				const map = { [item.id]: item };
				this.selectedItemList = Object.freeze( list );
				this.selectedItemMap  = Object.freeze( map );
			}

			if ( refreshInput !== false )
				this.refreshInputValue();
		},
		unselectItem( item, refreshInput ) {
			if ( typeof(item) !== 'object' || !item.$vueSelectNormalized )
				item = this.normalizeItem( item );
				
			const list = [];
			const map = Object.assign( {}, this.selectedItemMap );
			delete map[item.id];
			for ( const id in map )
				list.push( map[id] );
			this.selectedItemList = Object.freeze( list );
			this.selectedItemMap  = Object.freeze( map );
			if ( refreshInput !== false )
				this.refreshInputValue();
		},
		setItemList( items ) {
			this.setItemListDebounced.cancel();
			
			this.itemList__ticket = null;
			this.itemList = null;
			this.itemMap  = null;
			if ( !items ) {
				return;
			} else if ( typeof items === 'string' ) {
				this.itemList = items;
				return;
			} else if ( Array.isArray( items ) ) {
				
				const list = [];
				const map = {};
				for ( let i = 0, len = items.length; i<len; ++i ) {
					const originalItem = items[i];

					const item = this.normalizeItem( originalItem );

					list.push( item );
					map[item.id] = item;
				}
				this.itemList = Object.freeze( list );
				this.itemMap  = Object.freeze( map );
				return;
			} else if ( typeof(items) === 'function' ) {
				const ticket = {};
				this.itemList__ticket = ticket;
				Promise.resolve( items( this.searchTextValue ) )
					.then( ( items ) => {
						if ( this.itemList__ticket !== ticket )
							return;
						this.setItemList( items );
					});
			}
		},
		toggleActive( status, needFocus ) {
			if ( this.disabled ) {
				this.dropdownActive = false;
				this.$refs.input.blur();
				this.$refs.valueContainer.blur();
				return;
			}
			this.dropdownActive = ( status == null ) ? !this.dropdownActive : !!status;
			if ( needFocus ) {
				if ( this.dropdownActive ) {
					this.$nextTick( () => { this.$refs.input.focus(); } );
				} else {
					this.$nextTick( () => { this.$refs.valueContainer.focus(); } );
				}
			}
		},
		
		normalizeItem( item ) {
			return {
				id:    this.getItemId(item),
				text:  this.getItemText(item),
				short: this.getItemShortText(item),
				value: item,

				$vueSelectNormalized: true,
			};
		},
		getItemId( item ) {
			return this.getItemMeta( item, 'id' );
		},
		getItemShortText( item ) {
			return this.getItemMeta( item, 'short' ) || this.getItemText( item );
		},
		getItemText( item ) {
			return this.getItemMeta( item, 'text' );
		},
		getItemMeta( item, name ) {
			if ( typeof(item) === 'string' )
				return item;
			if ( this.meta && this.meta[name] ) {
				if ( typeof(this.meta[name]) === 'string' )
					return item[this.meta[name]] || "";
				else if ( typeof(this.meta[name]) === 'function' )
					return this.meta[name].call( null, item );
			}
			return item[name] || '';
		},
		getItemClass( item ) {
			if ( this.selectedItemMap[item.id] )
				return 'vue-select__list-item--selected';
			return false;
		},

		setValue( value ) {
			if ( value === this.selectedItemInput )
				return;

			this.selectedItemList = Object.freeze( [] );
			this.selectedItemMap  = Object.freeze( {} );
			if ( Array.isArray( value ) ) {
				for ( let i = 0, len = value.length; i<len; ++i )
					this.selectItem( value[i], false );
			} else if ( value ) {
				this.selectItem( value, false );
			}
			this.refreshInputValue();
		},
		refreshInputValue() {
			if ( this.multiple === false ) {
				if ( this.selectedItemList.length <= 0 )
					this.selectedItemInput = null;
				else
					this.selectedItemInput = this.selectedItemList[0].value;
			} else {
				this.selectedItemInput = Object.freeze( this.selectedItemList.map( ( i ) => i.value ) );
			}
			this.$emit( 'input', this.selectedItemInput );
		},	
		onBlur() {
			this.$nextTick( () => {
				if ( this.$refs.select.contains( document.activeElement ) && ( document.activeElement !== this.$refs.valueContainer ))
					return;
				this.dropdownActive = false;
			});
		},
		onContainerClick() {
			this.toggleActive( null, true );
		},
		onMenuClick( evt ) {
			let target = evt.target;
			while ( target ) {
				if ( target.classList && target.classList.contains( 'vue-select__list-item' ) )
					break;
				target = target.parentNode;
			}
			if ( !target )
				return;

			const id = target.dataset.itemId;
			if ( this.selectedItemMap[id] && this.multiple ) {
				this.unselectItem( this.selectedItemMap[id] );
				this.$refs.input.focus();
			} else if ( this.itemMap[ id ] )
				this.selectItem( this.itemMap[ id ] );

			
			if ( this.multiple === false || !evt.ctrlKey )
				this.toggleActive( false, true );
		},
		onKeyDown( evt ) {
			// this.toggleActive( true, true );
		},

	},
	watch: {
		searchTextValue() {
			if ( typeof(this.items) !== 'function' )
				return;
			this.setItemListDebounced( this.items );
		},
		items( items ) {
			this.setItemList( items );
		},
		value( value ) {
			this.setValue( value );
		},
		disabled( value ) {
			if ( value )
				this.toggleActive( false );
		},
	},
};
export default Select;
</script>
