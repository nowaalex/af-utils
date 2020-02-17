import camelCase from "lodash/camelCase";
import kebabCase from "lodash/kebabCase";

const addSetters = ( target, setters ) => {
    for( let j = 0, varName, setterName, eventName; j < setters.length; j++ ){
        varName = setters[ j ];
        setterName = camelCase( `set-${varName}` );
        eventName = kebabCase( `${varName}-changed` );
        target[ setterName ] = function( newValue ){
            const prevValue = this[ varName ];
            if( newValue !== prevValue ){
                this[ varName ] = newValue;
                this.Events.emit( eventName, newValue, prevValue );
            }
            return this;
        };
    }
};

export default addSetters;