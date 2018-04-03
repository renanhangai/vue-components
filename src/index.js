import Select from './select';

export default {
	install( vue, options ) {
		options = options || {};
		const ComponentSelect = Object.assign ? Object.assign( Select ) : Select;
		if ( options.mode ) {
			ComponentSelect.mode = options.mode;
		}
		vue.component( options.name || 'vue-select', ComponentSelect );
	},
};
