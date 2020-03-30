import React, { memo, useMemo, useEffect } from "react";
import { css, cx } from "emotion";

import Colgroup from "../common/Colgroup";
import TbodyScroller from "../common/TbodyScroller";
import ScrollContainer from "../../common/ScrollContainer";
import Thead from "../common/Thead";
import Tbody from "../common/Tbody";
import Tfoot from "../common/Tfoot";
import BodyTable from "../common/BodyTable";
import useApi from "../../useApi";

const theadTfootCommonClass = css`
    td, th {
        position: sticky;
        z-index: 1;
    }
`;

const theadClass = cx( theadTfootCommonClass, css`
    td, th {
        top: 0;
    }
`);

const tfootClass = cx( theadTfootCommonClass, css`
    td, th {
        bottom: 0;
    }
`);

const SUBSCRIBE_EVENTS = [
    "#headlessMode",
    "#totals"
];


/*
    Todo:
        measure thead & tfoot heights in order to properly calculate available space for rows
*/


const Sticky = ({
    tbodyRef,
    scrollContainerRef,
    getRowExtraProps,
    getCellExtraProps,
    RowComponent,
    CellComponent,
    TotalsCellComponent,
    fixedLayout,
    ...props
}) => {

    const { headlessMode, totals } = useApi( SUBSCRIBE_EVENTS );

    if( process.env.NODE_ENV !== "production" ){
        /*
            https://bugs.chromium.org/p/chromium/issues/detail?id=702927
        */

        const areTotalsPresent = totals && totals.length !== 0;

        useEffect(() => {
            if( !headlessMode || areTotalsPresent ){

                const table = scrollContainerRef.current.querySelector( "table" );
                const tableStyle = getComputedStyle( table );

                if( tableStyle.borderCollapse === "collapse" ){
                    console.warn(
                        "You use sticky table version. Due to special border behavior when scrolling, use border-collpase: separate.%o",
                        "https://bugs.chromium.org/p/chromium/issues/detail?id=702927"
                    );
                }
            }
        }, [ headlessMode, areTotalsPresent ]);
    }
    
    return (
        <ScrollContainer ref={scrollContainerRef} reportScrollLeft {...props}>
            {useMemo(() => (
                <BodyTable fixedLayout={fixedLayout}>
                    <Colgroup />
                    {headlessMode?null:<Thead className={theadClass} />}
                    <TbodyScroller />
                    <Tbody
                        tbodyRef={tbodyRef}
                        getRowExtraProps={getRowExtraProps}
                        getCellExtraProps={getCellExtraProps}
                        RowComponent={RowComponent}
                        CellComponent={CellComponent}
                    />
                    {totals && (
                        <Tfoot
                            className={tfootClass}
                            TotalsCellComponent={TotalsCellComponent}
                        />
                    )}
                </BodyTable>
            ), [ headlessMode, fixedLayout, totals, getRowExtraProps, getCellExtraProps, RowComponent, CellComponent, TotalsCellComponent ])}
        </ScrollContainer>
    );
}

export default memo( Sticky );