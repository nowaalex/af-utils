import React from "react";
import { observer } from "mobx-react-lite";

const NBSP = "\u00A0";

const Total = observer(({ cache, showSummaryType, summaryType, summaryName, formatTotal }) => {
    const res = cache[ summaryType ];

    let finalSummaryString = summaryName;

    if( showSummaryType ){
        finalSummaryString += NBSP + summaryType;
    }

    if( finalSummaryString ){
        finalSummaryString += ":" + NBSP;
    }

    finalSummaryString += formatTotal ? formatTotal( res ) : res;

    return res !== undefined ? (
        <div key={summaryType} title={summaryType} className="afvscr-summary">
            {finalSummaryString}
        </div>
    ) : null;
});

const TotalsCell = ({ cellTotals, totalsCache, summaryName, formatTotal }) => {

    if( !cellTotals || !totalsCache ){
        return null;
    }

    if( cellTotals.length === 1 ){
        return (
            <Total
                summaryType={cellTotals[0]}
                summaryName={summaryName}
                cache={totalsCache}
                formatTotal={formatTotal}
            />
        );
    }

    return cellTotals.map( summaryType => (
        <Total
            key={summaryType}
            showSummaryType
            summaryType={summaryType}
            summaryName={summaryName}
            cache={totalsCache}
            formatTotal={formatTotal}
        />
    ));
};

TotalsCell.defaultProps = {
    summaryName: ""
};

export default observer( TotalsCell );