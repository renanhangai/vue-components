module.exports = {
	entry: {
		dist:   './index.js',
		select: './select.vue',
	},
	output: {
		path: __dirname,
		filename: '[name].js',
	},
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
							scss: ['vue-style-loader', 'css-loader', 'sass-loader' ],
						},
					},
				},
			}],
		}],
	},
	externals: {
		'fuse.js': { commonjs: 'fuse.js', amd: 'fuse.js', root: 'Fuse' },
	},
};
