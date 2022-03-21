const plugins = [
    [ "module-resolver", { "root": [ "./src" ] }],
    [ "@babel/plugin-proposal-class-properties", { loose: true }],
    [ "@babel/plugin-proposal-object-rest-spread", { loose: true, useBuiltIns: true }],
];

const presets = [];

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
    }

    presets.push([ "@babel/preset-env", presetEnvOptions ]);

    return {
        plugins,
        presets
    };
};