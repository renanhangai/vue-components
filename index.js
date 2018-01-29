import Select from './select.vue';

export default {
	Select,
	install( vue, options ) {
		if ( typeof(options) === 'string' )
			options = { name: options };
		options = options || {};
		vue.component( options.name || 'vue-select', Select );
	},
};
