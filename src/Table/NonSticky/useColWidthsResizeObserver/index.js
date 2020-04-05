import { useRef, useEffect, useCallback } from "react";

const useColWidthsResizeObserver = API => {

    const observerRef = useRef();
    const mutationObserverRef = useRef();

    let RO = observerRef.current;
    let MO = mutationObserverRef.current;

    if( !RO ){
        RO = observerRef.current = new ResizeObserver( entries => {
            for( let j = 0, colIndex; j < entries.length; j++ ){
                const { target } = entries[ j ];
                colIndex = parseInt( target.getAttribute( "aria-colindex" ) );

                /*
                    using target.offsetWidth instead of contentRect.width, because we need border-box sizing, 
                    and { box: border-box } option does not work here
                */
                API.tbodyColumnWidths[ colIndex - 1 ] = Math.round( target.offsetWidth );
            }
            API.emit( "tbody-column-widths-changed" );
        });

        MO = mutationObserverRef.current = new MutationObserver( entries => {
            for( let i = 0; i < entries.length; i++ ){
                const { addedNodes, removedNodes } = entries[ i ];
                for( let j = 0; j < addedNodes.length; j++ ){
                    RO.observe( addedNodes[ j ] );
                }
                for( let j = 0; j < removedNodes.length; j++ ){
                    RO.unobserve( removedNodes[ j ] );
                }
            }   
        });
    }

    useEffect(() => () => {
        RO.disconnect();
        MO.disconnect();
    }, []);

    /* callback ref */
    return useCallback( trNode => {
        MO.disconnect();
        RO.disconnect();
        if( trNode ){
            MO.observe( trNode, { childList: true });
        }
    }, []);
};

export default useColWidthsResizeObserver;