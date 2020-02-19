const path = require( "path" );
const HtmlWebpackPlugin = require( "html-webpack-plugin" );
const { BundleAnalyzerPlugin } = require( "webpack-bundle-analyzer" );

module.exports = ( env, argv ) => ({
    entry: "./example/index.js",
    devtool: "source-map",
    output: {
        path: path.resolve(__dirname, "exampleAssets" )
    },
    optimization: {
        splitChunks: {
            minSize: 30000,
            minChunks: 1,
            maxAsyncRequests: 100,
            maxInitialRequests: 100,
            cacheGroups: {
                afReactTable: {
                    test: /[\\/]src[\\/]/,
                    priority: -9,
                    chunks: "all",
                    name: "afReactTable",
                    minSize: 0
                },
                lodash: {
                    test: /lodash/,
                    priority: -8,
                    chunks: "all",
                    name: "lodash",
                    minSize: 0
                },
                eventemitter3: {
                    test: /eventemitter3/,
                    priority: -7,
                    chunks: "all",
                    name: "eventemitter3",
                    minSize: 0
                },
                useResizeObserver: {
                    test: /use-resize-observer/,
                    priority: -6,
                    chunks: "all",
                    name: "use-resize-observer",
                    minSize: 0
                },
                faker: {
                    test: /faker/,
                    priority: -4,
                    chunks: "all",
                    name: "faker(fake data generator)",
                    minSize: 0
                },
                emotion: {
                    test: /emotion/,
                    priority: -4,
                    chunks: "all",
                    name: "emotion",
                    minSize: 0
                },
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    name: "node_modules"
                },
                default: {
                    priority: -20,
                    reuseExistingChunk: true,
                    name: "other"
                }
            }
        }
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