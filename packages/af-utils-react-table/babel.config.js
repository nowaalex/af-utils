const plugins = [
    ["module-resolver", { root: ["./src"] }],
    "@babel/plugin-transform-runtime",
    [
        "transform-react-remove-prop-types",
        {
            mode: "unsafe-wrap"
        }
    ]
];

const presets = [
    ["@babel/preset-react", { runtime: "automatic" }],
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
