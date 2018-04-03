"use strict";

const webpack = require( 'webpack' );
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
	mode: 'production',
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
		new MiniCssExtractPlugin({
			filename: '[name].css',
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
							scss: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader' ],
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
