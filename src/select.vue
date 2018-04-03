<template lang="pug">
div.vue-select(role="combobox" :class="selectClass" ref="select" @blur="onBlur" @keydown="onKeyDown")
	div.vue-select__value-container(:tabindex="dropdownActive ? -1 : 0" @click="onContainerClick")
		div.vue-select__placeholder {{placeholder}} MASKDMkasd

	div.vue-select__list-container(:style="{ 'z-index': zIndex }")
		.vue-select__search-container
			input.vue-select__search(ref="input" @blur="onBlur" v-model="searchText")
		ul.vue-select__list
			li.vue-select__item(v-for="item in 5" tabindex="0") OI
</template>
<style lang="scss">
.vue-select {
	position: relative;
	
	.vue-select__list-container {
		display: none;
		
		position: absolute;
		top: 100%;
	}


	// Styles when active
	&.vue-select--dropdown-active {
		.vue-select__list-container { display: block; }
	}
};
</style>
<script>
// import Fuse from 'fuse.js';

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

			searchText: "",
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
	},
	methods: {
		refreshList() {
		},
		onBlur() {
			this.$nextTick( () => {
				if ( this.$refs.select.contains( document.activeElement ) )
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
	},
};
export default Select;
</script>
