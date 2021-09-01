import { useState, cloneElement, useEffect } from "react";
import { observe, unobserve } from "src/utils/dimensionsObserver";

const ExtraHeight = ({ model, children }) => {

    const [ el, ref ] = useState();

    useEffect(() => {
        if( el && model ){
            let prevHeight = 0;

            observe( el, ({ offsetHeight }) => {
                model.updateExtraStickyHeight( offsetHeight - prevHeight );
                prevHeight = offsetHeight;
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