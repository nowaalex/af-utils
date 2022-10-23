const plugins = [
    ["module-resolver", { root: ["./"] }],
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

export default {
    plugins,
    presets
};
