import React from "react";

const TotalsCell = ({ cellTotals, totalsCache, formatTotal }) => {

    if( !cellTotals || !totalsCache ){
        return null;
    }

    if( cellTotals.length === 1 ){
        const summaryType = cellTotals[ 0 ];
        const res = totalsCache[ summaryType ];
        return (
            <div title={summaryType} className="afvscr-summary">
                {formatTotal?formatTotal(res):res}
            </div>
        );
    }

    return cellTotals.map( summaryType => {
        const res = totalsCache[ summaryType ];
        return res !== undefined ? (
            <div key={summaryType} className="afvscr-summary">
                {summaryType}:&nbsp;{formatTotal?formatTotal(res):res}
            </div>
        ) : null;
    });
};

export default TotalsCell;