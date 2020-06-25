const plugins = [
    "emotion",
    "annotate-pure-calls",
    [ "@babel/plugin-proposal-decorators", { "legacy": true }],
    [ "@babel/plugin-proposal-class-properties", { loose: true }],
    [ "@babel/plugin-proposal-object-rest-spread", { loose: true, useBuiltIns: true }],
    [ "transform-react-remove-prop-types", {
        mode: "wrap"
    }]
];

const presets = [ "@babel/preset-react" ];

module.exports = api => {

    const presetEnvOptions = {
        loose: true
    };

    if( api.env( "test" ) ){
        presetEnvOptions.targets = {
            node: "current"
        };
    }
    else{
        presetEnvOptions.modules = false;
        plugins.push([ "@babel/plugin-transform-runtime", { useESModules: true }]);
        if( !api.env( "lib" ) ){
            presets.push( "@emotion/babel-preset-css-prop" );
        }
    }

    presets.push([ "@babel/preset-env", presetEnvOptions ]);

    return {
        plugins,
        presets
    };
};