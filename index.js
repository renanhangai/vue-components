import Component, {InputMaskManager} from './component.vue';

InputMaskManager.install = function( vue, options ) {
	if ( typeof(options) === 'string' )
		options = { name: options };
	options = options || {};
	vue.component( options.name || 'vue-input-mask', Component );
};
export default InputMaskManager;
