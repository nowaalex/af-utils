import React from "react";
import { observer } from "mobx-react-lite";
import css from "./style.module.scss";

const NBSP = "\u00A0";

const Total = observer(({ cache, showSummaryType, summaryType, summaryName, countSummaryName, formatTotal }) => {
    const res = cache[ summaryType ];

    let finalSummaryString = summaryType === "count" ? countSummaryName : summaryName;

    if( showSummaryType ){
        finalSummaryString += NBSP + summaryType;
    }

    if( finalSummaryString ){
        finalSummaryString += ":" + NBSP;
    }

    finalSummaryString += formatTotal ? formatTotal( res ) : res;

    return res !== undefined ? (
        <div key={summaryType} title={summaryType} className={css.summary}>
            {finalSummaryString}
        </div>
    ) : null;
});

const TotalsCell = ({ cellTotals, totalsCache, summaryName, countSummaryName, formatTotal }) => {

    if( !cellTotals || !totalsCache ){
        return null;
    }

    if( cellTotals.length === 1 ){
        return (
            <Total
                summaryType={cellTotals[0]}
                summaryName={summaryName}
                countSummaryName={countSummaryName}
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
            countSummaryName={countSummaryName}
            cache={totalsCache}
            formatTotal={formatTotal}
        />
    ));
};

TotalsCell.defaultProps = {
    summaryName: "",
    countSummaryName: ""
};

export default observer( TotalsCell );