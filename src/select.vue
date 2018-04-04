<template lang="pug">
div.vue-select(role="combobox" :class="selectClass" ref="select" @blur.capture="onBlur" @keydown="onKeyDown")

	div.vue-select__value-container(ref="valueContainer" :class="formControl" tabindex="0" @mousedown="onContainerClick" :data-placeholder="placeholder || '\xa0'") {{valueText}}
		
	div.vue-select__dropdown-container(:style="{ 'z-index': zIndex }")
		.vue-select__search-container
			input.vue-select__search(ref="input" :class="formControl" v-model="searchTextValue")

		slot(v-if="itemList === null" name="searching")
			div.vue-select__placeholder-text.vue-select__placeholder-searching Carregando
		slot(v-else-if="typeof itemList === 'string'" name="message" :message="itemList")
			div.vue-select__placeholder-text.vue-select__placeholder-message {{itemList}}
		slot(v-else-if="itemListFiltered.length <= 0" name="empty")
			div.vue-select__placeholder-text.vue-select__placeholder-empty Não foram encontrados resultados
		ul.vue-select__list(v-else @click.capture="onMenuClick")
			li.vue-select__list-item(v-for="item in itemListFiltered" tabindex="0" :data-item-id="item.id" :key="item.id" :class="getItemClass(item)")
				slot(name="option" :item="item.value" :text="item.text")
					| {{item.text}}


</template>
<style lang="scss">
.vue-select {
	position: relative;


	.vue-select__value-container {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
		
		&:empty:before {
			content: attr(data-placeholder);
			color: #888;
		}
	}
	
	
	.vue-select__dropdown-container {
		display: none;
		
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
	}
	.vue-select__search-container {
		padding: 0.5rem 8px 1rem;
	}
	.vue-select__list {
		margin-bottom: 0;
		padding-left: 0;
		li { 
			display: block; 
			padding: 0.25rem 8px;
			&:hover {
				background-color: #f0f0f0;
				cursor: pointer;
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


	// Themes
	&.vue-select--bootstrap4 {

		&.vue-select--dropdown-active {
			.vue-select__value-container {
				border-bottom-left-radius: 0;
				border-bottom-right-radius: 0;
			}
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
import _find from 'lodash.find';

const Select = {
	mode: () => 'foundation6',
	props: {
		value: true,
		items: true,
		mode:  String,
		disabled: Boolean,
		placeholder: String,
		multiple: { type: [Boolean, Number], default: false },

		search: { type: Boolean, default: true },
		filter: { type: [Boolean, String, Array], default: false },
		
		// Style options
		zIndex: Number,
	},
	data() {
		return {
			dropdownActive: false,

			searchTextValue: "",

			itemList: null,
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
				'vue-select--foundation6': ( this.selectMode === 'foundation6' ),
				'vue-select--bootstrap4': ( this.selectMode === 'bootstrap4' ),
			};
		},
		formControl() {
			return ( this.selectMode === 'bootstrap4' || this.selectMode === 'bootstrap3' ) ? 'form-control' : false;
		},


		fuseFilter() {
			if ( this.filter === false )
				return null;

			const keys = this.filter === true ? [ 'text' ] : (typeof this.filter === 'string') ? [ 'text', this.filter ] : this.filter;
				
			const fuse = new Fuse( this.itemList, {
				keys: keys,
			} );
			return Object.freeze({ fuse: fuse });
		},
		itemListFiltered() {
			if ( !this.fuseFilter || ( this.searchTextValue.length < 3) )
				return this.itemList;
				
			const results = this.fuseFilter.fuse.search( this.searchTextValue );
			return Object.freeze( results );
		},


		valueText() {
			if ( this.selectedItemList.length <= 0 )
				return "";
			return this.selectedItemList.map( ( item ) => this.getItemShortText( item ) ).join( "," );
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
				for ( const id of map )
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
				this.itemMap  = map;
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
			this.dropdownActive = ( status == null ) ? !this.dropdownActive : !!status;
			if ( this.dropdownActive && needFocus )
				this.$nextTick( () => { this.$refs.input.focus(); } );
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
			if ( typeof(item) === 'string' )
				return item;
			return item.id;
		},
		getItemShortText( item ) {
			if ( typeof(item) === 'string' )
				return item;
			return item.short || item.text;
		},
		getItemText( item ) {
			if ( typeof(item) === 'string' )
				return item;
			return item.text || '';
		},
		getItemClass( item ) {
			if ( this.selectedItemMap[item.id] )
				return 'vue-select__list-item--selected';
			return false;
		},

		setValue( value ) {
			if ( value === this.selectedItemInput )
				return;
			else if ( Array.isArray( value ) ) {
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
				this.selectedItemInput = this.selectedItemList.map( ( i ) => i.value );
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

			const item = this.itemMap[ id ];
			if ( item == null )
				return;

			if ( this.selectedItemMap[id] )
				this.unselectItem( item );
			else
				this.selectItem( item );

			if ( this.multiple === false )
				this.toggleActive( false );
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

		value( value ) {
			this.setValue( value );
		},
	},
};
export default Select;
</script>
