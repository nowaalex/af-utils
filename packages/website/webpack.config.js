const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require( "copy-webpack-plugin" );
const SitemapPlugin = require("sitemap-webpack-plugin").default;
const webpack = require( "webpack" );

const BUILD_PATH = path.resolve(__dirname, "build");

module.exports = () => {

	const env = process.env;
    const isProd = env.PROD === "true";
    
	return {
		bail: true,
		devtool: isProd ? "source-map" : "eval",
		target: "browserslist",
		entry: "./src/index.js",
		output: {
			publicPath: env.BASE_URL,
			path: BUILD_PATH,
			filename: isProd ? "[contenthash].js" : "[name].[id].js"
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
				filename: isProd ? "[contenthash].css" : "[name].css",
				chunkFilename: isProd ? "[contenthash].css" : "[id].css"
			}),
			new HtmlWebpackPlugin({
                title: "af-virtual-scroll"
			}),
			isProd ? new CopyPlugin({
				patterns: [
					  { from: "./google/", to: BUILD_PATH },
					  { from: "./preview.gif", to: BUILD_PATH }
				],
			}) : null,
			isProd ? new SitemapPlugin({
				base: 'https://af-virtual-scroll.vercel.app',
				paths: [
					"/docs/why/",
					"/docs/list/",
					"/docs/table/",
					"/docs/bundleSize/",

					"/examples/custom/simple/",
					"/examples/list/equalHeights/",
					"/examples/list/loadOnDemand/",
					"/examples/list/simple/",
					"/examples/list/variableRowHeights/",
					"/examples/table/equalHeights/",
					"/examples/table/headless/",
					"/examples/table/simple/",
					"/examples/table/variableRowHeights/"
				],
				options: {
					lastmod: true,
					changefreq: 'monthly',
					priority: 0.5
				}
			}) : null
		].filter( Boolean )
	};
}
