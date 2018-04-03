"use strict";

const webpack = require( 'webpack' );
const ExtractTextPlugin = require( "extract-text-webpack-plugin" );
const UglifyJsPlugin = require( 'uglifyjs-webpack-plugin' );

module.exports = {
	entry: {
		'vue-select': './src/select.vue',
	},
	output: {
		path: __dirname + "/dist",
		filename: '[name].js',
		library: "VueSelect",
		libraryTarget: "umd",
	},
	plugins: [
		new ExtractTextPlugin('[name].css'),
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: '"production"'
			}
		}),
		new UglifyJsPlugin({
			sourceMap: true,
		}),
		new webpack.LoaderOptionsPlugin({
			minimize: true
		}),
	],
	module: {
		rules: [{
			oneOf: [{
				test: /\.jsx?$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
			}, {
				test: /\.vue$/,
				use: {
					loader: 'vue-loader',
					options: {
						loaders: {
							scss: ExtractTextPlugin.extract({ fallback: 'vue-style-loader', use: ['css-loader', 'sass-loader' ] }),
						},
					},
				},
			}],
		}],
	},
	externals: {
		'fuse.js': { commonjs: 'fuse.js', commonjs2: 'fuse.js', amd: 'fuse.js', root: 'Fuse' },
	},
};
