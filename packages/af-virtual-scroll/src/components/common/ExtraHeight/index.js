import { useRef, useCallback, cloneElement } from "react";
import { observe, unobserve } from "utils/dimensionsObserver";

const ExtraHeight = ({ model, children }) => {

    const prevEl = useRef( null );
    const prevHeight = useRef( 0 );

    const updateRef = useCallback( el => {
        
        if( prevEl.current ){
            unobserve( prevEl.current );
            model.updateExtraStickyHeight( -prevHeight.current );
        }

        if( el ){
            observe( el, ({ offsetHeight }) => {
                model.updateExtraStickyHeight( offsetHeight - prevHeight.current );
                prevHeight.current = offsetHeight;
            });
        }

        prevEl.current = el;
    }, [ model ]);

    return cloneElement( children, { ref: updateRef });
}

export default ExtraHeight;