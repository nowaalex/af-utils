import React from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react-lite";
import useApi from "../../useApi";
import { getRowProps } from "../../utils/extraPropsGetters";
import TotalsCell from "./TotalsCell";

const TotalCells = observer(({ columns, totals, totalsCache }) => columns.map(({ dataKey, label, countSummaryName, formatTotal }) => (
    <TotalsCell
        key={dataKey}
        summaryName={label}
        countSummaryName={countSummaryName}
        cellTotals={totals&&totals[dataKey]}
        totalsCache={totalsCache[dataKey]}
        formatTotal={formatTotal}
    />
)));

const GroupStateIndicator = observer(({ Rows, groupPath }) => (
    <span
        style={{
            paddingLeft: ( groupPath.length - 1 ) * 1.5 + "em"
        }}
        className="afvscr-group-state-indicator"
        data-expanded={Rows.isGroupExpanded( groupPath )?"":undefined}
        onClick={() => Rows.toggleExpandedState( groupPath )}
    />
));

const GroupRow = ({ columns, groupPath, rowIndex }) => {

    const { totals, Rows, columnsByDataKey } = useApi();

    const last = groupPath.length - 1;
    const column = columnsByDataKey[Rows.aggregators.groups[ last ]];
    const groupName = column.getGroupName( groupPath[ last ] );

    return (
        <tr {...getRowProps(null,rowIndex)}>
            <td colSpan={columns.length} className="afvscr-group-cell">
                <GroupStateIndicator Rows={Rows} groupPath={groupPath} />
                {groupName}
                <div className="afvscr-group-summaries">
                    <TotalCells
                        columns={columns}
                        totals={totals}
                        totalsCache={Rows.getGroupTotals( groupPath )}
                    />
                </div>
            </td>
        </tr>
    );
};

GroupRow.propTypes = {
    columns: PropTypes.array.isRequired,
    rowIndex: PropTypes.number.isRequired,
    groupPath: PropTypes.array.isRequired
};

export default observer( GroupRow );