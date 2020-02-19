import React, { memo, useEffect, useCallback } from "react";
import { css } from "emotion";
import useResizeObserver from "use-resize-observer";
import Table from "./Table";
import { useApiPlugin } from "../useApi";

const wrapperClass = css`
    min-height: 0;
    flex: 1 1 auto;
    position: relative;
    overflow: hidden;
`;

const overflowWrapperClass = css`
    overflow: auto;
    position: absolute;
    top: 0;
    left: 0;
`;

const SUBSCRIBE_EVENTS = [
    "widget-scroll-height-changed",
    "is-scrolling-changed"
];

const TableBody = memo(({
    tbodyRef,
    scrollContainerRef,
    getRowData,
    getRowKey,
    getRowExtraProps,
    RowComponent,
    CellComponent,
    fixedLayout,
}) => {

    const API = useApiPlugin( SUBSCRIBE_EVENTS );

    const { width, height, ref } = useResizeObserver();

    useEffect(() => {
        API.setWidgetHeight( height ).setWidgetWidth( width );
    }, [ height, width ]);


    const scrollHandler = useCallback( e => {
        const { scrollTop, scrollLeft } = e.target;
        API.setScrollTop( scrollTop ).setScrollLeft( scrollLeft );
    }, []);

    const scrollWrapperStyle = {
        width,
        height
    };

    const heightProviderStyle = {
        pointerEvents: API.isScrolling ? "none" : "auto",
        height: API.widgetScrollHeight,
        maxHeight: API.widgetScrollHeight
    };
    
    /*
        tabIndex="0" is for proper keyboard nav
    */
    return (
        <div className={wrapperClass} ref={ref}>
            <div tabIndex="0" className={overflowWrapperClass} style={scrollWrapperStyle} ref={scrollContainerRef} onScroll={scrollHandler}>
                <div style={heightProviderStyle}>
                    <Table
                        tbodyRef={tbodyRef}
                        getRowData={getRowData}
                        getRowKey={getRowKey}
                        getRowExtraProps={getRowExtraProps}
                        RowComponent={RowComponent}
                        CellComponent={CellComponent}
                        fixedLayout={fixedLayout}
                    />
                </div>
            </div>
        </div>
    );
});

export default TableBody;