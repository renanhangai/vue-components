import { storiesOf } from '@storybook/vue';
import Vue from 'vue';
import VueSelect from '../src';
import "bootstrap4/dist/css/bootstrap.min.css";

import StoryMultiple from './select/Multiple.vue';

Vue.use( VueSelect );

storiesOf( 'VueSelect', module)
	.add( "Multiple",  () => StoryMultiple );