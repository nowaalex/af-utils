import { useState, cloneElement, useEffect } from "react";
import { observe, unobserve } from "utils/heightObserver";

const ExtraHeight = ({ model, children }) => {

    const [ el, ref ] = useState();

    useEffect(() => {
        if( el && model ){
            let prevHeight = 0;

            observe( el, height => {
                model.updateExtraStickyHeight( height - prevHeight );
                prevHeight = height;
            });
    
            return () => {
                unobserve( el );
                model.updateExtraStickyHeight( -prevHeight );
            }
        }
    }, [ el, model ]);

    return cloneElement( children, { ref });
}

export default ExtraHeight;