import React, { forwardRef, useCallback } from "react";
import useResizeObserver from "use-resize-observer";
import cx from "../utils/cx";
import HeightProvider from "./HeightProvider";
import useApi from "../useApi";

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

    const resizeHandler = useCallback(({ width, height }) => {
        API.set( "widgetHeight", height ).set( "widgetWidth", width );
    }, []);

    useResizeObserver({ ref, onResize: resizeHandler });
    
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