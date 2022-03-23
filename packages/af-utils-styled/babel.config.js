const plugins = [
    ["module-resolver", { root: ["./src"] }],
    "@babel/plugin-transform-runtime"
];

const presets = [
    [
        "@babel/preset-env",
        {
            loose: true
        }
    ]
];

module.exports = {
    plugins,
    presets
};
