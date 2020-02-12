import React, { memo, useLayoutEffect, useCallback } from "react";
import useResizeObserver from "use-resize-observer";
import { css } from "@emotion/core";
import Table from "./Table";
import { useApiPlugin } from "../useApi";

const SUBSCRIBE_EVENTS = [
    "widget-scroll-height-changed"
];

const wrapperCss = css`
    min-height: 0;
    flex: 1 1 auto;
    position: relative;
    overflow: hidden;
    table {
        width: 100%;
    }
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
    CellComponent
}) => {

    const API = useApiPlugin( SUBSCRIBE_EVENTS );

    const { width, height, ref } = useResizeObserver();

    useLayoutEffect(() => {
        API.setWidgetHeight( height );
        API.setWidgetWidth( width );
    }, [ width, height ]);

    const scrollHandler = useCallback( e => {
        const { scrollTop, scrollLeft } = e.target;
        API.setScrollTop( scrollTop );
        API.setScrollLeft( scrollLeft );
    }, []);
    
    return (
        <div css={wrapperCss} ref={ref}>
            <div css={overflowContainerCss} style={{ width, height }} ref={scrollContainerRef} onScroll={scrollHandler}>
                <div style={{ height: API.widgetScrollHeight }}>
                    <Table
                        tbodyRef={tbodyRef}
                        getRowData={getRowData}
                        getRowKey={getRowKey}
                        getRowExtraProps={getRowExtraProps}
                        RowComponent={RowComponent}
                        CellComponent={CellComponent}
                    />
                </div>
            </div>
        </div>
    );
});

export default TableBody;