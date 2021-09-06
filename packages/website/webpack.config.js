const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require( "copy-webpack-plugin" );
const webpack = require( "webpack" );

const BUILD_PATH = path.resolve(__dirname, "build");

module.exports = () => {

	const env = process.env;
    const shouldCompress = env.PROD === "true";
    
	return {
		bail: true,
		devtool: shouldCompress ? "source-map" : "eval",
		target: "browserslist",
		entry: "./src/index.js",
		output: {
			publicPath: env.BASE_URL,
			path: BUILD_PATH,
			filename: shouldCompress ? "[contenthash].js" : "[name].[id].js"
		},
		optimization: {
			minimizer: [
				new TerserPlugin({
					extractComments: "all",
					parallel: true
				}),
				new CssMinimizerPlugin()
			],
			splitChunks: {
				minSize: 6000,
				minChunks: 1,
				maxAsyncRequests: 20,
				maxInitialRequests: 10
			}
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					exclude: /node_modules/,
					loader: "babel-loader"
				},
				{
					test: /\.s?css$/,
					use: [
						MiniCssExtractPlugin.loader,
						{
							loader: "css-loader",
							options: {
								sourceMap: true,
								importLoaders: 1
							}
						},
						{
							loader: "sass-loader",
							options: {
								sourceMap: true
							}
						}
					]
				}
			]
		},
		devServer: {
			historyApiFallback: true
		},
		plugins: [
			new webpack.EnvironmentPlugin([ "NODE_ENV", "BASE_URL" ]),
			new CleanWebpackPlugin(),
			new MiniCssExtractPlugin({
				ignoreOrder: true,
				filename: shouldCompress ? "[contenthash].css" : "[name].css",
				chunkFilename: shouldCompress ? "[contenthash].css" : "[id].css"
			}),
			new HtmlWebpackPlugin({
                title: "af-virtual-scroll"
			}),
			new CopyPlugin({
				patterns: [
					  { from: "./google/", to: BUILD_PATH },
					  { from: "./preview.gif", to: BUILD_PATH }
				],
			}),
		]
	};
}
