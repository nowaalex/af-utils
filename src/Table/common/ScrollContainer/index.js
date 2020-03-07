import React, { forwardRef, useCallback } from "react";
import useResizeObserver from "use-resize-observer";
import { css, cx } from "emotion";
import HeightProviderCached from "./HeightProviderCached";
import useApi from "../../../useApi";

const SUBSCRIBE_EVENTS = [
    "#totalRows",
    "#columns"
];

const tableClass = css`
    min-width: 100%;
`;

/*
    * flex: 1 1 auto, assuming that table would be used full-stretch mostly
    * border-box is important, because head th widths are synced with td widths
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
    fixedLayout,
    ...props
}, ref ) => {

    const API = useApi( SUBSCRIBE_EVENTS );

    const scrollHandler = useCallback( e => {
        const { scrollTop, scrollLeft } = e.target;
        API.set( "scrollTop", scrollTop ).set( "scrollLeft", scrollLeft );
        if( onScroll ){
            onScroll( e );
        }
    }, [ onScroll ]);

    const resizeHandler = useCallback(({ width, height }) => {
        API.set( "widgetHeight", height ).set( "widgetWidth", width );
    }, []);

    useResizeObserver({ ref, onResize: resizeHandler });

    /* Hmm, I can't put translateY more than ~ 3 000 000. Maybe need to figure this out) */
    const tableStyle = {
        tableLayout: fixedLayout ? "fixed" : "auto"
    };
    
    /*
        tabIndex="0" is for proper keyboard nav
        https://bugzilla.mozilla.org/show_bug.cgi?id=1346159
    */
    return (
        <div tabIndex="0" className={cx(scrollContainerClass,className)} ref={ref} onScroll={scrollHandler} {...props}>
            {HeightProviderCached}
            <table className={cx(tableClass,className)} aria-rowcount={API.totalRows} style={tableStyle} aria-colcount={API.columns.length}>
                {children}
            </table>
        </div>
    );
});

export default ScrollContainer;