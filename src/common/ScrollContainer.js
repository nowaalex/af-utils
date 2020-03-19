import React, { forwardRef, useCallback } from "react";
import useResizeObserver from "use-resize-observer";
import { css, cx } from "emotion";
import HeightProvider from "./HeightProvider";
import useApi from "../useApi";

const SUBSCRIBE_EVENTS = [];

/*
    * flex: 1 1 auto, assuming that table would be used full-stretch mostly
    width: 100% covers case, when no tbody is rendered and exact width cannot be calculated
*/
const scrollContainerClass = css`
    overflow: auto;
    outline: none;
    min-height: 0;
    flex: 1 1 auto;
    position: relative;
`;

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
        <div tabIndex="0" className={cx(scrollContainerClass,className)} ref={ref} onScroll={scrollHandler} {...props}>
            <HeightProvider />
            {children}
        </div>
    );
});

export default ScrollContainer;