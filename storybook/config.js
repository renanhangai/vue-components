import { configure } from '@storybook/vue';
import "regenerator-runtime/runtime";


configure( function() {
	require( './Select' );
}, module );