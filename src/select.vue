<template lang="pug">
div.vue-select(role="combobox" :class="selectClass" tabindex="0")

</template>
<style lang="scss">
.vue-select {
	position: relative;
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
	},
	data() {
		return {
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
			};
		},
	},
	created() {
	},
	methods: {
	},
	watch: {
	},
};
export default Select;
</script>
