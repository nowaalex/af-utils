import React, { Fragment } from "react";
import { observer } from "mobx-react-lite";

const Total = observer(({ cache, showSummaryType, summaryType, formatTotal }) => {
    const res = cache[ summaryType ];

    return res !== undefined ? (
        <div key={summaryType} title={summaryType} className="afvscr-summary">
            {showSummaryType ? (
                <Fragment>{summaryType}&nbsp;</Fragment>
            ) : null}
            {formatTotal?formatTotal(res):res}
        </div>
    ) : null;
});

const TotalsCell = ({ cellTotals, totalsCache, formatTotal }) => {

    if( !cellTotals || !totalsCache ){
        return null;
    }

    if( cellTotals.length === 1 ){
        return (
            <Total
                summaryType={cellTotals[0]}
                cache={totalsCache}
                formatTotal={formatTotal}
            />
        );
    }

    return cellTotals.map( summaryType => (
        <Total
            showSummaryType
            summaryType={summaryType}
            cache={totalsCache}
            formatTotal={formatTotal}
        />
    ));
};

export default observer( TotalsCell );