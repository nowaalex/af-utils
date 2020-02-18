const BASIC_PLUGINS = [
    "@babel/plugin-syntax-dynamic-import",
    "emotion",
    [ "@babel/plugin-proposal-class-properties", { loose: true }],
    [ "@babel/plugin-proposal-object-rest-spread", { loose: true, useBuiltIns: true }],
    [ "@babel/plugin-transform-runtime", { useESModules: true }]
];

const BASIC_PRESETS = [ "@babel/preset-react", "@emotion/babel-preset-css-prop" ];

module.exports = api => {
    api.cache( true );
    return {
        plugins: BASIC_PLUGINS,
        presets: BASIC_PRESETS.concat([
            [ "@babel/preset-env", {
                modules: false,
                loose: true
            }]
        ]),
        env: {
            production: {
                plugins: BASIC_PLUGINS.concat(
                    "transform-react-remove-prop-types"
                )
            },
            test: {
                presets: BASIC_PRESETS.concat([
                    [ "@babel/preset-env", {
                        loose: true
                    }]
                ]),
                plugins: BASIC_PLUGINS.concat(
                    "dynamic-import-node",
                    "babel-plugin-transform-es2015-modules-commonjs"
                )
            }
        }
    };
};