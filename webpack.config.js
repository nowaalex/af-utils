const path = require( "path" );
const webpack = require( "webpack" );
const HtmlWebpackPlugin = require( "html-webpack-plugin" );
const { BundleAnalyzerPlugin } = require( "webpack-bundle-analyzer" );

module.exports = ( env, argv ) => ({
    entry: "./websiteSrc/index.js",
    devtool: "source-map",
    output: {
        publicPath:         env.ASSETS_PATH,
        path: 				path.resolve( __dirname, "website" ),
        jsonpFunction:      "Z",
        filename: 			"[name].[contenthash].js",
        sourceMapFilename: 	"sm.[name].[contenthash].map"
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
        modules: [ "node_modules", "src" ],
        alias: {
            "af-virtual-scroll": path.resolve(__dirname,"./")
        }
       /*
         alias: {
            "react-dom$": "react-dom/profiling",
            "scheduler/tracing": "scheduler/tracing-profiling",
        }
        */
    },
    devServer: {
        historyApiFallback: true
    },
    plugins: [
        new webpack.DefinePlugin({
            ASSETS_PATH: JSON.stringify( env.ASSETS_PATH )
        }),
        new HtmlWebpackPlugin({
            title: "Table"
        })
    ].concat( argv.mode === "production" ? new BundleAnalyzerPlugin({
        analyzerMode: "static",
        reportFilename: "bundle.html"
    }) : [])
});