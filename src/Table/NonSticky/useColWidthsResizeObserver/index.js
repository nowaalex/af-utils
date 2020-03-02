import { useRef, useEffect } from "react";

const useColWidthsResizeObserver = API => {

    const observerRef = useRef();
    const trRef = useRef();

    let O = observerRef.current;

    if( !O ){
        O = observerRef.current = new ResizeObserver( entries => {
            for( let j = 0, colIndex; j < entries.length; j++ ){
                const { target } = entries[ j ];
                colIndex = parseInt( target.getAttribute( "aria-colindex" ) );
                API.tbodyColumnWidths[ colIndex - 1 ] = Math.round( target.offsetWidth );
            }
            API.emit( "tbody-column-widths-changed" );
        });
    }

    useEffect(() => {
        if( trRef.current ){
            for( let node = trRef.current.firstElementChild; node; node = node.nextElementSibling ){
                O.observe( node );
            }
            return () => {
                O.disconnect();
            };
        }
    }, [ trRef.current ]);

    return trRef;
};

export default useColWidthsResizeObserver;