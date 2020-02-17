import React, { memo, useLayoutEffect, useCallback } from "react";
import useResizeObserver from "use-resize-observer";
import { css } from "@emotion/core";
import Table from "./Table";
import { useApiPlugin } from "../useApi";

const SUBSCRIBE_EVENTS = [
    "widget-scroll-height-changed",
    "is-scrolling-changed"
];

const wrapperCss = css`
    min-height: 0;
    flex: 1 1 auto;
    position: relative;
    overflow: hidden;
`;

const overflowContainerCss = css`
    overflow: auto;
    position: absolute;
    top: 0;
    left: 0;
`;

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

    useLayoutEffect(() => {
        API.setWidgetHeight( height ).setWidgetWidth( width );
    }, [ height, width ]);


    const scrollHandler = useCallback( e => {
        const { scrollTop, scrollLeft } = e.target;
        API.setScrollTop( scrollTop ).setScrollLeft( scrollLeft );
    }, []);

    const scrollWrapperStyle = {
        contain: "strict",
        width,
        height
    };
    
    return (
        <div css={wrapperCss} ref={ref}>
            <div css={overflowContainerCss} style={scrollWrapperStyle} ref={scrollContainerRef} onScroll={scrollHandler}>
                <div style={{ pointerEvents: API.isScrolling ? "none" : "auto", height: API.widgetScrollHeight, maxHeight: API.widgetScrollHeight }}>
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