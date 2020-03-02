import React, { memo, useMemo, Fragment } from "react";
import PropTypes from "prop-types";
import { css, cx } from "emotion";

import useApi from "../../useApi";
import TableWrapper from "./TableWrapper";

import Thead from "../common/Thead";
import Tfoot from "../common/Tfoot";
import Tbody from "../common/Tbody";

import ColgroupCached from "../common/ColgroupCached";
import TbodyScrollerCached from "../common/TbodyScrollerCached";
import ScrollContainer from "../common/ScrollContainer";


/*
    border-box is important, because head th widths are synced with td widths
*/
const wrapperClass = css`
    display: flex;
    flex-flow: column nowrap;
`;

const headerFooterClass = css`
    flex: 0 0 auto;
    table-layout: fixed;
    min-width: 100%;
`;

const hiddenHeaderFooterClass = css`
    visibility: hidden;
    th, td {
        line-height: 0 !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        border-top: none !important;
        border-bottom: none !important;
    }
`;

const subscribeEvents = [
    "headless-mode-changed",
    "totals-changed"
];

const TableHeaderCached = (
    <TableWrapper className={headerFooterClass}>
        <Thead />
    </TableWrapper>
);

const TableFooterCached = (
    <TableWrapper className={headerFooterClass}>
        <Tfoot />
    </TableWrapper>
);

const NonSticky = ({
    className,
    tbodyRef,
    scrollContainerRef,
    getRowExtraProps,
    RowComponent,
    CellComponent,
    fixedLayout,
    onScroll,
    ...props
}) => {

    const { headlessMode, totals } = useApi( subscribeEvents );

    /*
        Hidden tfoot & thead are needed to 'hold' widths of columns.
        There are 3 tables rendered in this mode, so they need to be synced somehow
    */

    return (
        <div className={cx(wrapperClass, className )} {...props}>
            {headlessMode?null:TableHeaderCached}
            <ScrollContainer ref={scrollContainerRef} fixedLayout={fixedLayout} onScroll={onScroll}>
                {useMemo(() => (
                    <Fragment>
                        {ColgroupCached}
                        <Thead className={hiddenHeaderFooterClass} />
                        <Tfoot className={hiddenHeaderFooterClass} />
                        {TbodyScrollerCached}
                        <Tbody
                            tbodyRef={tbodyRef}
                            getRowExtraProps={getRowExtraProps}
                            RowComponent={RowComponent}
                            CellComponent={CellComponent}
                        />
                    </Fragment>
                ), [ fixedLayout, getRowExtraProps, RowComponent, CellComponent ])}
            </ScrollContainer>
            {totals&&TableFooterCached}
        </div>
    )
}

export default memo( NonSticky );