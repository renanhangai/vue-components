import { storiesOf } from '@storybook/vue';

import VueSelect from '../src/select';

storiesOf('VueSelect', module)
	.add('story as a component', () => ({
		components: { VueSelect },
		template: `<vue-select :items="['Teste', 'Option']" />`
	}));