import { useState, cloneElement, useEffect } from "react";
import { observe, unobserve } from "utils/heightObserver";
import useApi from "hooks/useApi";

const ExtraStickyHeight = ({ children }) => {

    const API = useApi();
    const [ el, ref ] = useState();

    useEffect(() => {
        if( el ){
            let prevHeight = 0;

            observe( el, height => {
                API.updateExtraStickyHeight( height - prevHeight );
                prevHeight = height;
            });
    
            return () => {
                unobserve( el );
                API.updateExtraStickyHeight( -prevHeight );
            }
        }
    }, [ el ]);

    return cloneElement( children, { ref });
}

export default ExtraStickyHeight;