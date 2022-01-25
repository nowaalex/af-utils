import dynamic from "next/dynamic";
import Code from "/components/Code";

const requireComponent = require.context( "/components/examples", true, /index\.js$/, "lazy" );
const requireCode = require.context( "!!raw-loader!/components/examples", true, /index\.js$/, "lazy" );

const toUrl = link => link.replace( /^\./, "/examples" ).replace( /\/index\.js$/, "" );

const keys = requireComponent.keys();

export const components = keys.map( toUrl );

export const table = Object.fromEntries( keys.map( path => [
    toUrl( path ),
    {
        Component: dynamic(
            () => requireComponent( path )
        ),
        ComponentCode: dynamic(
            () => requireCode( path ).then( code => ({ children, ...props }) => <Code {...props}>{code.default}</Code> )
        )
    }
]));

