import React from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react-lite";
import useApi from "../../useApi";
import { getRowProps } from "../../utils/extraPropsGetters";
import TotalsCell from "./TotalsCell";

const GroupRow = ({ columns, groupPath, rowIndex }) => {
    const { totals, Rows } = useApi();

    const expanded = Rows.isGroupExpanded( groupPath );
    const last = groupPath.length - 1;
    const TT = Rows.getGroupTotals( groupPath );

    return (
        <tr {...getRowProps(null,rowIndex)}>
            <td colSpan={columns.length} className="afvscr-group-cell" style={{ paddingLeft: ( groupPath.length - 1 ) * 1.5 + "em" }}>
                <button onClick={() => Rows.setExpandedState( groupPath, !expanded )}>
                    {expanded ? "-" : "+"}
                </button>
                &nbsp;
                {Rows.columnsByDataKey[Rows.aggregators.groups[ last ]].label}:&nbsp;{groupPath[ last ]}
                <div className="afvscr-group-summaries">
                    {columns.map(({ dataKey, formatTotal }) => (
                        <TotalsCell
                            key={dataKey}
                            summaryName={dataKey}
                            cellTotals={totals[dataKey]}
                            totalsCache={TT[dataKey]}
                            formatTotal={formatTotal}
                        />
                    ))}
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