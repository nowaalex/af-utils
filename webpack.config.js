const path = require( "path" );
const HtmlWebpackPlugin = require( "html-webpack-plugin" );
const { BundleAnalyzerPlugin } = require( "webpack-bundle-analyzer" );

module.exports = ( env, argv ) => ({
    entry: "./example/index.js",
    devtool: "source-map",
    output: {
        path: path.resolve(__dirname, "exampleAssets" )
    },
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader"
				}
            },
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader"
                ]
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
    ].concat( argv.mode === "production" ? new BundleAnalyzerPlugin({
        analyzerMode: "static",
        reportFilename: "bundle.html"
    }) : [])
});