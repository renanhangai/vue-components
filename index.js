import Component, {InputMaskManager} from './component.vue';

InputMaskManager.install = function( vue ) {
	vue.component( 'vue-input-mask', Component );
};
export default InputMaskManager;
