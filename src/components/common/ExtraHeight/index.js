import { useState, cloneElement, useEffect } from "react";
import useApi from "hooks/useApi";

const ExtraStickyHeight = ({ children }) => {

    const API = useApi();
    const [ el, ref ] = useState();

    useEffect(() => {
        if( el ){
            let prevHeight = 0;

            const R = new ResizeObserver( entries => {
                const roundedHeight = Math.round( entries[ 0 ].contentRect.height );
                API.updateExtraStickyHeight( roundedHeight - prevHeight );
                prevHeight = roundedHeight;
            });
    
            R.observe( el );
    
            return () => {
                R.unobserve( el );
                API.updateExtraStickyHeight( -prevHeight );
            }
        }
    }, [ el ]);

    return cloneElement( children, { ref });
}

export default ExtraStickyHeight;