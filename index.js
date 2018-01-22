import Component from './component.vue';

export default {
	install( vue ) {
		vue.component( 'vue-input-mask', Component );
	},
};
