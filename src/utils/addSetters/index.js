import camelCase from "lodash/camelCase";
import kebabCase from "lodash/kebabCase";

const addSetters = ( target, setters ) => {
    for( let varName of setters ){
        const setterName = camelCase( `set-${varName}` );
        const eventName = kebabCase( `${varName}-changed` );
        target[ setterName ] = function( newValue ){
            const prevValue = this[ varName ];
            if( newValue !== prevValue ){
                this[ varName ] = newValue;
                this.emit( eventName, prevValue );
            }
            return this;
        };
    }
};

export default addSetters;