const path = require( "path" );

module.exports = {
    addons: [
        "@storybook/addon-storysource",
        "@storybook/addon-docs"
    ],
    stories: [
        "../src/**/*.stories.mdx",
        "../src/**/*.stories.@(js|jsx|ts|tsx)"
    ],
    webpackFinal: async config => {
        config.module.rules.push({
            test: /\.scss$/,
            use: [ "style-loader", "css-loader", "sass-loader" ],
            include: path.resolve(__dirname, "../"),
        });
        return config;
    }
}