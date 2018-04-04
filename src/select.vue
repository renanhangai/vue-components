<template lang="pug">
div.vue-select(role="combobox" :class="selectClass" ref="select" @blur.capture="onBlur" @keydown="onKeyDown")

	div.vue-select__value-container(ref="valueContainer" :class="formControl" tabindex="0" @mousedown="onContainerClick")
		| {{placeholder}} asdasdasd
		
	div.vue-select__dropdown-container(:style="{ 'z-index': zIndex }")
		.vue-select__search-container
			input.vue-select__search(ref="input" :class="formControl" v-model="searchTextValue")

		slot(v-if="itemList === null" name="searching")
			div.vue-select__placeholder-text.vue-select__placeholder-searching Carregando
		slot(v-else-if="typeof itemList === 'string'" name="message" :message="itemList")
			div.vue-select__placeholder-text.vue-select__placeholder-message {{itemList}}
		slot(v-else-if="itemList.length <= 0" name="empty")
			div.vue-select__placeholder-text.vue-select__placeholder-empty Não foram encontrados resultados
		ul.vue-select__list(v-else)
			li.vue-select__list-item(v-for="item in itemList" tabindex="0")
				slot(name="option" :item="item")
					| {{item}}


</template>
<style lang="scss">
.vue-select {
	position: relative;
	
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
		.vue-select__dropdown-container {
			background-color: #fff;
			border: 1px solid #ccc;
			// border-top: none;
		}

	}
	// &.vue-select--bootstrap4 {

	// 	.vue-select__value-container {
	// 		position: relative;
	// 		display: block;
	// 		width: 100%;
	// 		padding: .375rem .75rem;
	// 		font-size: 1rem;
	// 		line-height: 1.5;
	// 		color: #495057;
	// 		background-color: transparent;

	// 		&:before {
	// 			content: "";
	// 			position: absolute;
	// 			top: 0;
	// 			left: 0;
	// 			right: 0;
	// 			bottom: 0;
	// 			border: 1px solid #222;
	// 			border-radius: .25rem;

	// 			transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
	// 			z-index: 10;
	// 			opacity: 0.3;
	// 		}

	// 		&:focus {
	// 			outline: 0;
	// 			&:before {
	// 				border-color: var(--primary);
	// 				box-shadow: 0 0 0 0.2rem var(--primary);
	// 			}
	// 		}
	// 	}

	// 	.vue-select__search-container {
	// 		padding: 0.5rem 0 1rem;
	// 	}

	// 	.vue-select__dropdown-container {
	// 		background-color: #fff;
	// 	}
	// }
};
</style>
<script>
// import Fuse from 'fuse.js';
import debounce from 'lodash.debounce';

const Select = {
	mode: () => 'foundation6',
	props: {
		value: true,
		items: true,
		mode:  String,
		disabled: Boolean,
		placeholder: String,
		
		// Style options
		zIndex: Number,
	},
	data() {
		return {
			dropdownActive: false,

			searchTextValue: "",

			itemList: null,
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
	},
	created() {
		this.setItemListDebounced = debounce( this.setItemList, 250 );
		this.setItemList( this.items );
	},
	methods: {
		setItemList( items ) {
			this.setItemListDebounced.cancel();
			
			this.itemList__ticket = null;
			this.itemList = null;
			if ( !items ) {
				return;
			} else if ( typeof items === 'string' ) {
				this.itemList = items;
				return;
			} else if ( Array.isArray( items ) ) {
				this.itemList = items;
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
		onKeyDown( evt ) {
			// this.toggleActive( true, true );
		},
		toggleActive( status, needFocus ) {
			this.dropdownActive = ( status == null ) ? !this.dropdownActive : !!status;
			if ( this.dropdownActive && needFocus )
				this.$nextTick( () => { this.$refs.input.focus(); } );
		}
	},
	watch: {
		searchTextValue() {
			if ( typeof(this.items) !== 'function' )
				return;
			this.setItemListDebounced( this.items );
		},
	},
};
export default Select;
</script>
