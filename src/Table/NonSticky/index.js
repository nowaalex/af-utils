import React, { memo, useMemo, Fragment } from "react";
import PropTypes from "prop-types";
import { css, cx } from "emotion";

import useApi from "../../useApi";
import TableHeader from "./TableHeader";
import TableFooter from "./TableFooter";

import Thead from "../common/Thead";
import Tfoot from "../common/Tfoot";

import ColgroupCached from "../common/ColgroupCached";
import TbodyScrollerCached from "../common/TbodyScrollerCached";
import ScrollContainer from "../common/ScrollContainer";
import Tbody from "../common/Tbody";


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

const TableHeaderCached = <TableHeader className={headerFooterClass} />;
const TableFooterCached = <TableFooter className={headerFooterClass} />;

const NonSticky = ({
    className,
    tbodyRef,
    scrollContainerRef,
    getRowExtraProps,
    RowComponent,
    CellComponent,
    fixedLayout,
    ...props
}) => {

    const { headlessMode, totals } = useApi( subscribeEvents );

    return (
        <div className={cx(wrapperClass, className )} {...props}>
            {headlessMode?null:TableHeaderCached}
            <ScrollContainer ref={scrollContainerRef} fixedLayout={fixedLayout}>
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