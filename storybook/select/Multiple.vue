<template>
	<div :class="$style.view">
		<mode-selector v-model="mode" />
		<div class="test-group" data-label="Exemplo básico">
			<vue-select :mode="mode" :items="['Item1', 'Item2', 'Item3']" multiple />
		</div>
	</div>
</template>
<style lang="scss" module>
:global :local(.view) {
	padding: 1rem 8px;
	.test-group {
		margin-bottom: 1rem;
	}

	.mode-selection {
		display: flex;
		justify-content: flex-end;

		.mode-selection__item {
			padding: 0 8px;
			cursor: pointer;
			&.mode-selection__item--selected { 
				font-weight: bold;
				text-decoration: underline;
			}
		}
	}
}
</style>

<script>
import ModeSelector from './ModeSelector';

export default {
	components: { ModeSelector },
	data() {
		return {
			mode: "default",
		};
	},
}
</script>
