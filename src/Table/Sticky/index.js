import React, { memo, useMemo, Fragment, useEffect } from "react";
import PropTypes from "prop-types";
import { css, cx } from "emotion";

import ColgroupCached from "../common/ColgroupCached";
import TbodyScrollerCached from "../common/TbodyScrollerCached";
import ScrollContainer from "../common/ScrollContainer";
import Thead from "../common/Thead";
import Tbody from "../common/Tbody";
import Tfoot from "../common/Tfoot";
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
    "headless-mode-changed",
    "totals-changed"
];


/*
    Todo:
        measure thead & tfoot heights in order to properly calculate available space for rows
*/


const Sticky = ({
    className,
    tbodyRef,
    scrollContainerRef,
    getRowExtraProps,
    RowComponent,
    CellComponent,
    ...props
}) => {

    const { headlessMode, totals } = useApi( SUBSCRIBE_EVENTS );

    if( process.env.NODE_ENV !== "production" ){
        /*
            https://bugs.chromium.org/p/chromium/issues/detail?id=702927
        */

        useEffect(() => {
            const table = scrollContainerRef.current.querySelector( "table" );
            const tableStyle = getComputedStyle( table );
            if( !headlessMode || totals.length ){
                if( tableStyle.borderCollapse === "collapse" ){
                    console.warn(
                        "You use sticky table version. Due to special border behavior when scrolling, use border-collpase: separate.%o",
                        "https://bugs.chromium.org/p/chromium/issues/detail?id=702927"
                    );
                }
            }
        }, [ headlessMode, totals.length === 0 ]);
    }
    
    return (
        <ScrollContainer className={className} ref={scrollContainerRef} {...props}>
            {useMemo(() => (
                <Fragment>
                    {ColgroupCached}
                    {headlessMode?null:<Thead className={theadClass} />}
                    {TbodyScrollerCached}
                    <Tbody
                        tbodyRef={tbodyRef}
                        getRowExtraProps={getRowExtraProps}
                        RowComponent={RowComponent}
                        CellComponent={CellComponent}
                    />
                    {totals&&<Tfoot className={tfootClass} />}
                </Fragment>
            ), [ headlessMode, totals, getRowExtraProps, RowComponent, CellComponent ])}
        </ScrollContainer>
    );
}

export default memo( Sticky );