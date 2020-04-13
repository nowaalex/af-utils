import React, { memo } from "react";
import PropTypes from "prop-types";
import useApi from "../../useApi";

const SUBSCRIBE_EVENTS = [
    "#columns",
    "#totals",
    "totals-calculated"
];

const FooterCells = ({ TotalsCellComponent }) => {

    const { columns, totals, totalsCache } = useApi( SUBSCRIBE_EVENTS );

    return columns.map(({ dataKey, formatTotal, visibility }, j ) => {

        if( visibility === "hidden" ){
            return null;
        }

        const curTotals = totals[ dataKey ];
        const curTotalsCache = totalsCache[ dataKey ];

        return (
            <td key={dataKey} aria-colindex={j+1}>
                <TotalsCellComponent
                    cellTotals={curTotals}
                    totalsCache={curTotalsCache}
                    formatTotal={formatTotal}
                />
            </td>
        );
    });
};

FooterCells.propTypes = {
    TotalsCellComponent: PropTypes.elementType.isRequired
}

export default memo( FooterCells );