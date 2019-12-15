const HtmlWebpackPlugin = require( "html-webpack-plugin" );

module.exports = {
    entry: "./example/index.js",
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader"
				}
			}
		]
    },
    resolve: {
        modules: [ "node_modules", "src" ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "Table"
        })
    ]
};
