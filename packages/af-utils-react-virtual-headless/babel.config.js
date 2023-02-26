const plugins = [
    "@babel/plugin-transform-runtime",
    [
        "transform-react-remove-prop-types",
        {
            mode: "unsafe-wrap"
        }
    ]
];

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
