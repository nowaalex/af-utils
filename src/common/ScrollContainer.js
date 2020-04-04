import React, { forwardRef, useCallback, useEffect } from "react";
import cx from "../utils/cx";
import HeightProvider from "./HeightProvider";
import useApi from "../useApi";
import resizeObserverOptions from "../constants/resizeObserverOptions";

const SUBSCRIBE_EVENTS = [];

const ScrollContainer = forwardRef(({
    className,
    children,
    onScroll,
    reportScrollLeft,
    ...props
}, ref ) => {

    const API = useApi( SUBSCRIBE_EVENTS );

    const scrollHandler = useCallback( e => {
        const { scrollTop, scrollLeft } = e.target;
        API.set( "scrollTop", scrollTop );
        if( reportScrollLeft ){
            API.set( "scrollLeft", scrollLeft );
        }
        if( onScroll ){
            onScroll( e );
        }
    }, [ onScroll, reportScrollLeft ]);

    useEffect(() => {
        const el = ref.current;

        const R = new ResizeObserver( entries => {
            if( entries.length === 1 ){
                const { width, height } = entries[ 0 ].contentRect;

                API
                    .set( "widgetHeight", Math.round( height ) )
                    .set( "widgetWidth", Math.round( width ) );
            }
        });

        R.observe( el, resizeObserverOptions );

        return () => {
            R.unobserve( el );
        };
    }, []);
    
    /*
        tabIndex="0" is for proper keyboard nav
        https://bugzilla.mozilla.org/show_bug.cgi?id=1346159
    */
    return (
        <div tabIndex="0" className={cx("afvscr-scroll-container",className)} ref={ref} onScroll={scrollHandler} {...props}>
            <HeightProvider />
            {children}
        </div>
    );
});

export default ScrollContainer;