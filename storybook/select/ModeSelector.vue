<template>
	<div :class="$style.view">
		<div class="mode-item" :class="{'mode-item--selected': (value == item.mode) }" v-for="item in modeList" :key="item.mode" @click="onClick(item)">
			{{item.label}}
		</div>
	</div>
</template>
<style lang="scss" module>
:global :local(.view) {
	display: flex;
	justify-content: flex-end;
	.mode-item {
		padding: 0 8px;
		cursor: pointer;
		&.mode-item--selected { 
			font-weight: bold;
			text-decoration: underline;
		}
	}
}
</style>

<script>
const MODES = [
	{ mode: "default", label: "Default" },
	{ mode: "bootstrap4", label: "Bootstrap 4" },
];

export default {
	props: {
		value: String,
	},
	data() {
		return {
			modeList: MODES,
		};
	},
	created() {
		if ( this.value == null )
			this.$emit( 'input', 'default' );
	},
	methods: {
		onClick( item ) {
			this.$emit( 'input', item.mode );
		},
	},
}
</script>
