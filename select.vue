<template lang="pug">
div.vue-select(role="combobox" :class="selectClasses" tabindex="0" @keydown="onInputKey" ref="select" aria-haspopup="true" :aria-expanded="dropdownActive ? 'true' : 'false'")

	//- Select main container
	div.vue-select__value(@mousedown="onClickContainer")
		template(v-if="internalValue !== null") {{valueText}}
		span.vue-select__value-placeholder(v-else) {{placeholder}}

	//- Dropdown com os items do select
	div.vue-select__dropdown
		//- Campo de input para a busca
		div.vue-select__dropdown-input-container(v-if="search")
			input(ref="input" type="text" v-model="searchText" @blur="onInputBlur" autocomplete="off" autocapitalize="off")
		input.vue-select__dropdown-input-hidden(v-else aria-hidden="true" ref="input" @blur="onInputBlur" @keydown="onInputAutoSearch")
					
		//- Lista de items para fazer o select
		div.vue-select__item-list(@mousedown="onClickItem" @mousemove="onMousemoveItem" ref="itemList" :style="{maxHeight: itemListHeight}")
			div.vue-select__item-loading-container(v-if="itemList == null")
				slot(name="loading")
					div.vue-select__item-base Carregando...
			div.vue-select__item-empty-container(v-if="itemListFiltered && (itemListFiltered.length <= 0)")
				slot(name="empty")
					div.vue-select__item-base Não foram encontrados resultados
			template(v-else)
				div.vue-select__item-base.vue-select__item(v-for="item, key in itemListFiltered" :key="key" :data-item-key="key" :class="{ 'vue-select__item--selected': (key === selectedKey) }" role="option")
					| {{getItemText( item )}}
</template>
<style lang="scss">
.vue-select {
	position: relative;
	cursor: pointer;
	
	.vue-select__dropdown {
		position: absolute;
		cursor: default;
		top: 100%;
		left: 0;
		right: 0;
		border: 1px solid #cacaca;
		border-top: none;
		background-color: #fff;
		box-shadow: 0 4px 4px -2px rgba(0, 0, 0, 0.2);
		display: none;
		overflow: hidden;
		z-index: 1;
	}
	&.vue-select--dropdown-active .vue-select__dropdown {
		display: block;
	}
	
	/* Placeholders */
	.vue-select__value-placeholder, .vue-select__item-placeholder {
		color: #aaa;
		user-select: none;
		pointer-events: none;
	}
	
	.vue-select__value {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	/* Container com o input*/
	.vue-select__dropdown-input-container {
		padding: 8px 4px;
	}
	.vue-select__dropdown-input-hidden {
		position: absolute;
		left: -1000px;
		height: 0;
	}
	
	/* Lista de items */
	.vue-select__item-list {
		position: relative;
		max-height: 256px;
		overflow: auto;
	}
	.vue-select__item-base {
		padding: 8px;
	}
	.vue-select__item {
		cursor: pointer;
		&.vue-select__item--selected {
			background-color: #eee;
		}
	}
	.vue-select__item-loading-container, .vue-select__item-empty-container {
		color: #aaa;
	}
	
	
	
	/**
	 * Styles for foundation6
	 */
	&.vue-select--foundation6 {
		.vue-select__value {
			height: 2.4375rem;
			margin: 0 0 1rem;
			padding: 0.5rem;
			appearance: none;
			border: 1px solid #cacaca;
			border-radius: 0;
			background-color: #fefefe;
			font-family: inherit;
			font-size: 1rem;
			font-weight: normal;
			line-height: 1.5;
			color: #0a0a0a;
			
			background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='32' height='24' viewBox='0 0 32 24'><polygon points='0,0 32,0 16,24' style='fill: rgb%28138, 138, 138%29'></polygon></svg>");
			background-origin: content-box;
			background-position: right -1rem center;
			background-repeat: no-repeat;
			background-size: 9px 6px;
			padding-right: 1.5rem;
		}
		
		&:focus {
			outline: none;
			.vue-select__value {
				border: 1px solid #8a8a8a;
				background-color: #fefefe;
				box-shadow: 0 0 5px #cacaca;
				transition: box-shadow 0.5s, border-color 0.25s ease-in-out;
			}
		}
		
		input {
			margin-bottom: 0;
		}
	}
};
</style>
<script>
import Fuse from 'fuse.js';

const Select = {
	mode: () => 'foundation6',
	props: {
		value: true,
		items: true,
		mode:  String,
		disabled: Boolean,
		placeholder: String,
		search: {
			type: Boolean,
			default: true,
		},
		filter: {
			type: Boolean,
			default: true,
		},
	},
	data() {
		return {
			searchText: '',
			itemList: null,
			dropdownActive: false,
			selectedKey: -1,
			internalValue: null,
			itemListHeight: null,
		};
	},
	computed: {
		valueText() {
			return this.getItemText( this.internalValue );
		},
		selectClasses() {
			return {
				'vue-select--disabled': this.disabled,
				'vue-select--dropdown-active': this.dropdownActive,
				'vue-select--foundation6': ( this.selectMode === 'foundation6' ),
			};
		},
		itemListFiltered() {
			if ( this.fuse && this.searchText ) {
				return this.fuse.search( this.searchText, this.itemList );
			}
			return this.itemList;
		},
	},
	created() {
		this.selectMode = this.mode || Select.mode;
		if ( typeof(this.selectMode) === 'function' )
			this.selectMode = this.selectMode();

		this.refreshItems();
	},
	methods: {
		setItemList( list ) {
			if ( typeof(list) === 'function' ) {
				this.setItemList( list.call( null, this.searchText ) );
				return;
			}
			
			this.itemListGetter = null;
			this.itemList__ticket = null;
			if ( !list ) {
				this.itemList = null;
				return;
			}
			
			if ( Array.isArray( list ) ) {
				// Copy the list
				list = list.slice();
				this.itemList = Object.freeze( list );
			} else if ( typeof(list) === 'object' ) {
				if ( list.then ) {
					const ticket = {};
					this.itemList__ticket = ticket;
					list.then( this.setItemList, () => this.setItemList( null ) );
					return;
				}
				const newList = [];
				for ( let key in list )
					newList.push( { id: key, text: list[key] } );
				this.itemList = Object.freeze( newList );
				this.itemListGetter = ( item ) => item.id;
			} else if ( !Array.isArray( list ) )
				throw new Error( "Invalid list to set. Must be null, array or a promise returning one of these" );
			
		},
		refreshItems() {
			this.setItemList( this.items );
			this.refreshValue();
		},
		refreshValue() {
			if ( this.value == null || !this.itemList ) {
				this.internalValue = null;
			} else {
				for ( let i = 0, len = this.itemList.length; i<len; ++i ) {
					if ( (this.itemList[i] === this.value) || (this.itemList[i].id === this.value) || (this.itemList[i].id === this.value.id) ) {
						this.internalValue = this.itemList[i];
						break;
					}
				}
			}
		},
		getItemText( option ) {
			if ( typeof(option) === 'string' )
				return option;
			else if ( option )
				return option.text;
			return '';
		},
		
		/**
		 * Refresh the scroll based on the selected list
		 */
		refreshScroll() {
			if ( !this.$refs.itemList )
				return;
			for ( let i = 0, len = this.$refs.itemList.childNodes.length; i<len; ++i ) {
				const el = this.$refs.itemList.childNodes[i];
				if ( el && el.dataset && ( el.dataset.itemKey == this.selectedKey ) ) {
					const relativeY = el.offsetTop - this.$refs.itemList.scrollTop;
					if ( relativeY > ( this.$refs.itemList.clientHeight - el.clientHeight ) ) {
						this.$refs.itemList.scrollTop = el.offsetTop - (this.$refs.itemList.clientHeight - el.clientHeight);
					} else if ( relativeY < 0 ) {
						this.$refs.itemList.scrollTop = el.offsetTop;
					}
					return;
				}
				
			}
		},

		/**
		 * Event handlers
		 */
		onClickContainer( evt ) {
			if ( evt.which != 1 )
				return;

			this.dropdownActive = !this.dropdownActive;
			if ( this.dropdownActive ) {
				this.$nextTick( () => {
					if ( this.$refs.input )
						this.$refs.input.focus();
				});
			} else {
				this.$refs.select.focus();
			};
		},
		onClickItem( evt ) {
			if ( evt.which != 1 )
				return;
			
			const rect = evt.target.getBoundingClientRect();
			if ( evt.clientX > ( rect.left + evt.target.clientWidth ) ) {
				evt.stopPropagation();
				evt.preventDefault();
				return;
			}
			
			if ( evt.target.dataset.itemKey ) {
				const item = this.itemListFiltered[ evt.target.dataset.itemKey ];
				this.internalValue = item;
				this.$emit( 'input', this.itemListGetter ? this.itemListGetter(item) : item );
				this.dropdownActive = false;
				this.searchText = "";
			}
		},
		onMousemoveItem( evt ){
			if ( evt.target.dataset.itemKey )
				this.selectedKey = parseInt( evt.target.dataset.itemKey, 10 );
		},
		onInputBlur() {
			this.dropdownActive = false;
		},
		onInputKey( evt ) {
			if ( !this.dropdownActive ) {
				if ( ( evt.keyCode == 32 ) || ( evt.keyCode == 40 ) || ( evt.keyCode == 38 ) || ( evt.keyCode == 13 ) ) {
					evt.preventDefault();
					this.dropdownActive = true;
					this.$nextTick( () => {
						if ( this.$refs.input )
							this.$refs.input.focus();
					});
				} else if ( evt.key && (evt.key.length == 1 ) && (evt.key.match(/[a-z0-9]/i)) ) {
					this.searchText = evt.key;
					this.dropdownActive = true;
					this.$nextTick( () => {
						if ( this.$refs.input )
							this.$refs.input.focus();
					});
				}
				return;
			}
			if ( !this.itemListFiltered )
				return;
			if ( evt.keyCode == 13 ) {
				evt.preventDefault();
				const item = this.itemListFiltered[ this.selectedKey ];
				this.internalValue = item;
				this.$emit( 'input', this.itemListGetter ? this.itemListGetter(item) : item );
				this.dropdownActive = false;
				this.searchText = "";
				this.$refs.select.focus();
			} else if ( evt.keyCode == 40 ) {
				evt.preventDefault();
				this.selectedKey = Math.min( this.selectedKey + 1, this.itemListFiltered.length - 1 );
				this.refreshScroll();
			} else if ( evt.keyCode == 38 ) {
				evt.preventDefault();
				this.selectedKey = Math.max( this.selectedKey - 1, 0 );
				this.refreshScroll();
			} else if ( evt.keyCode == 27 ) {
				this.dropdownActive = false;
				this.searchText = "";
				this.$refs.select.focus();
			}
		},
		onInputAutoSearch( evt ) {
			if ( !this.itemListFiltered )
				return;
			if ( !evt.key || evt.key.length != 1 || !evt.key.match( /[a-z]/i ) )
				return;
			evt.stopPropagation();
			evt.preventDefault();

			const key = evt.key.toLowerCase();
			const len = this.itemListFiltered.length;
			let i = this.selectedKey >= 0 ? (this.selectedKey+1) : 0;
			for ( let j = 0; j<len; ++j, i = (i+1) % len ) {
				const text = this.getItemText( this.itemListFiltered[i] );
				if ( text.charAt(0).toLowerCase() === key ) {
					this.selectedKey = i;
					this.refreshScroll();
					break;
				}
			}
		},

	},
	watch: {
		searchText() {
			if ( this.dropdownActive )
				this.refreshItems();
		},
		dropdownActive( active ) {
			if ( this.dropdownActive ) {
				const doc  = document.documentElement;
				const maxHeight = doc.scrollHeight;
				this.itemListHeight = null;
				this.$nextTick( () => {
					const rect = this.$refs.itemList.getBoundingClientRect();
					const top  = rect.top + document.documentElement.scrollTop;
					if ( ( top + this.$refs.itemList.offsetHeight ) > maxHeight )
						this.itemListHeight = (maxHeight - top - 8)+'px';
				});
				this.refreshItems();
			}
		},
		items() {
			if ( this.dropdownActive )
				this.refreshItems();
		},
		itemList( list ) {
			if ( this.$refs.itemList )
				this.$refs.itemList.scrollTop = 0;
			if ( !this.filter || !this.search || !list ) {
				this.fuse = null;
				return;
			}

			let keys = this.filter;
			if ( keys === true )
				keys = ['text'];

			this.selectedKey = ( (this.value === null) ? 0 : -1 );
			this.fuse = new Fuse( list, {
				shouldSort: true,
				threshold: 0.6,
				location: 0,
				distance: 100,
				maxPatternLength: 32,
				minMatchCharLength: 1,
				keys: keys,
			} );

			if ( this.value == null ) {
				this.internalValue = null;
			} else {
				for ( let i = 0, len = list.length; i<len; ++i ) {
					if ( (list[i] === this.value) || (list[i].id === this.value) || (list[i].id === this.value.id) ) {
						this.internalValue = list[i];
						break;
					}
				}
			}
			
			this.$nextTick( () => {
				if ( this.value == null )
					return;
				for ( let i = 0, len = this.itemListFiltered.length; i<len; ++i ) {
					if ( (this.itemListFiltered[i] === this.value) || (this.itemListFiltered[i].id === this.value) || (this.itemListFiltered[i].id === this.value.id) ) {
						this.selectedKey = i;
						break;
					}
				}
			});
		},
		value( v ) {
			this.refreshValue();			
		},
	},
};
export default Select;
</script>
