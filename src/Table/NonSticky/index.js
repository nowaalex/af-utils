import React, { memo, useMemo, Fragment } from "react";
import PropTypes from "prop-types";
import { css, cx } from "emotion";

import useApi from "../../useApi";
import TableWrapper from "./TableWrapper";

import Thead from "../common/Thead";
import Tfoot from "../common/Tfoot";
import Tbody from "../common/Tbody";

import useColWidthsResizeObserver from "./useColWidthsResizeObserver";
import Colgroup from "../common/Colgroup";
import TbodyScrollerCached from "../common/TbodyScrollerCached";
import ScrollContainer from "../common/ScrollContainer";

const wrapperClass = css`
    display: flex;
    flex-flow: column nowrap;
    overflow: hidden;
    flex: 1 1 auto;
`;

const headerFooterClass = css`
    flex: 0 0 auto;
    table-layout: fixed;
`;

const hiddenHeaderFooterClass = css`
    visibility: hidden !important;
    th, td {
        line-height: 0 !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        border-top: none !important;
        border-bottom: none !important;
        max-height: 0 !important;
    }
`;

const subscribeEvents = [
    "#headlessMode",
    "#totals"
];

const NonSticky = ({
    className,
    tbodyRef,
    scrollContainerRef,
    getRowExtraProps,
    RowComponent,
    CellComponent,
    TotalsCellComponent,
    fixedLayout,
    onScroll,
    ...props
}) => {

    const API = useApi( subscribeEvents );

    const { headlessMode, totals } = API;

    /*
        Hidden tfoot & thead are needed to 'hold' widths of tbody columns no to be narrower than real thead/tfoot
        and notify model about columns width changes.
        There are 3 tables rendered in this mode, so their column widths need to be synced somehow.
    */

    const widthsObserverRef = useColWidthsResizeObserver( API );

    if( process.env.NODE_ENV !== "production" ){
        if( headlessMode && !totals ){
            console.warn( "NonSticky table is rendered without headers and footers. This is not ok." )
        }
    }

    return (
        <div className={cx(wrapperClass, className )} {...props}>
            {headlessMode ? null : (
                <TableWrapper className={headerFooterClass}>
                    <Thead />
                </TableWrapper>
            )}
            <ScrollContainer ref={scrollContainerRef} fixedLayout={fixedLayout} onScroll={onScroll}>
                {useMemo(() => (
                    <Fragment>
                        <Colgroup />
                        {headlessMode ? null : (
                            <Thead
                                className={hiddenHeaderFooterClass}
                                trRef={widthsObserverRef}
                            />
                        )}
                        {totals && (
                            <Tfoot
                                TotalsCellComponent={TotalsCellComponent}
                                className={hiddenHeaderFooterClass}
                                trRef={headlessMode?undefined:widthsObserverRef}
                            />
                        )}
                        {TbodyScrollerCached}
                        <Tbody
                            tbodyRef={tbodyRef}
                            getRowExtraProps={getRowExtraProps}
                            RowComponent={RowComponent}
                            CellComponent={CellComponent}
                        />
                    </Fragment>
                ), [ totals, headlessMode, fixedLayout, getRowExtraProps, RowComponent, CellComponent, TotalsCellComponent ])}
            </ScrollContainer>
            {totals && (
                <TableWrapper className={headerFooterClass}>
                    <Tfoot TotalsCellComponent={TotalsCellComponent} />
                </TableWrapper>
            )}
        </div>
    )
}

export default memo( NonSticky );