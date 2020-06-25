import React from "react";
import { observer } from "mobx-react-lite";
import PropTypes from "prop-types";

import useApi from "../../useApi";
import TableWrapper from "./TableWrapper";

import Thead from "../common/Thead";
import Tfoot from "../common/Tfoot";
import Tbody from "../common/Tbody";
import BodyTable from "../common/BodyTable";

import useColWidthsResizeObserver from "./useColWidthsResizeObserver";
import Colgroup from "../common/Colgroup";
import TbodyScroller from "../common/TbodyScroller";
import ScrollContainer from "../../common/ScrollContainer";
import cx from "../../utils/cx";

const NonSticky = ({
    className,
    tbodyRef,
    scrollContainerRef,
    getRowExtraProps,
    getCellExtraProps,
    RowComponent,
    CellComponent,
    TotalsCellComponent,
    onScroll,
    ...props
}) => {

    const API = useApi();

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
        <div className={cx("afvscr-nonst",className)} {...props}>
            {headlessMode ? null : (
                <TableWrapper>
                    <Thead />
                </TableWrapper>
            )}
            <ScrollContainer ref={scrollContainerRef} onScroll={onScroll}>
                <BodyTable>
                    <Colgroup />
                    {headlessMode ? null : (
                        <Thead
                            className="afvscr-hdnwrp"
                            trRef={widthsObserverRef}
                        />
                    )}
                    {totals && (
                        <Tfoot
                            TotalsCellComponent={TotalsCellComponent}
                            className="afvscr-hdnwrp"
                            trRef={headlessMode?widthsObserverRef:undefined}
                        />
                    )}
                    <TbodyScroller />
                    <Tbody
                        tbodyRef={tbodyRef}
                        getRowExtraProps={getRowExtraProps}
                        getCellExtraProps={getCellExtraProps}
                        RowComponent={RowComponent}
                        CellComponent={CellComponent}
                    />
                </BodyTable>
            </ScrollContainer>
            {totals && (
                <TableWrapper>
                    <Tfoot TotalsCellComponent={TotalsCellComponent} />
                </TableWrapper>
            )}
        </div>
    );
};

export default observer( NonSticky );