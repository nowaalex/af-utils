import { useRef, useEffect } from "react";
import resizeObserverOptions from "../../../constants/resizeObserverOptions";

const useColWidthsResizeObserver = API => {

    const observerRef = useRef();
    const trRef = useRef();

    let O = observerRef.current;

    if( !O ){
        O = observerRef.current = new ResizeObserver( entries => {
            for( let j = 0, colIndex; j < entries.length; j++ ){
                const { target, contentRect } = entries[ j ];
                colIndex = parseInt( target.getAttribute( "aria-colindex" ) );
                API.tbodyColumnWidths[ colIndex - 1 ] = Math.round( contentRect.width );
            }
            API.emit( "tbody-column-widths-changed" );
        });
    }

    useEffect(() => {
        if( trRef.current ){
            for( let node = trRef.current.firstElementChild; node; node = node.nextElementSibling ){
                O.observe( node, resizeObserverOptions );
            }
            return () => {
                O.disconnect();
            };
        }
    }, [ trRef.current ]);

    return trRef;
};

export default useColWidthsResizeObserver;