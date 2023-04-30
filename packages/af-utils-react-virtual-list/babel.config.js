const plugins = ["@babel/plugin-transform-runtime"];

const presets = [
    [
        "@babel/preset-env",
        {
            loose: true
        }
    ]
];

export default {
    plugins,
    presets
};
