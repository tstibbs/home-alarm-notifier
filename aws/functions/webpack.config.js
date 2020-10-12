const {NODE_ENV: mode = 'production'} = process.env

let config = {
	mode: mode,
	devtool: 'inline-source-map',
	target: 'node',
	entry: './src/index.mjs',
	output: {
		libraryTarget: 'commonjs2'
	}
}

module.exports = config
