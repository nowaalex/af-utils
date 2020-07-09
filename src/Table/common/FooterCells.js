import React from "react";
import { observer } from "mobx-react-lite";
import PropTypes from "prop-types";
import useApi from "../../useApi";

const FooterCells = ({ TotalsCellComponent }) => {

    const { columns, totals, Rows: { totalsCache } } = useApi();

    return columns.map(({ dataKey, formatTotal, visibility }, j ) => {

        if( visibility === "hidden" ){
            return null;
        }

        const curTotals = totals && totals[ dataKey ];
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

export default observer( FooterCells );