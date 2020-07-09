import set from "lodash/set";
import { lazy } from "react";

const toArr = ( obj, arr ) => {
    let v, a;
    for( let k in obj ) {
        v = obj[ k ];
        if( typeof v === "object" ){
            a = arr.find( el => el.name === k );
            if( !a ){
                a = { name: k, children: [] };
                arr.push( a );
            }
            toArr( v, a.children );
        } else {
            arr.push({
                name: k,
                path: `/examples/${v}`
            });
        }
    }
    return arr;
}

const Code = require.context( "!!raw-loader!./examples", true, /\.js$/ );
const Components = require.context( "./examples", true, /\.js$/, "lazy" );

const groupedMenu = Components.keys().reduce(( acc, path ) => set(
    acc,
    path.slice( 2, -3 ).split( "/" ),
    path.slice( 2, -3 )
), {});

export const ComponentsMap = Components.keys().reduce(( acc, path ) => {
    acc[ path.slice( 2, -3 ) ] = [
        lazy(() => Components( path )),
        Code( path ).default,
        path.slice( 2, -3 )
    ];
    return acc;
}, {});

export const ExamplesMenu = toArr( groupedMenu, [] );