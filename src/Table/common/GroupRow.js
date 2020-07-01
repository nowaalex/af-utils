import React from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react-lite";
import useApi from "../../useApi";
import { getRowProps } from "../../utils/extraPropsGetters";

const GroupRow = ({ columns, groupPath, rowIndex }) => {
    const { totals, Rows } = useApi();

    const expanded = Rows.isGroupExpanded( groupPath );
    const last = groupPath.length - 1;
    const TT = Rows.groupTotals[ groupPath.join( "." ) ];

    return (
        <tr {...getRowProps(null,rowIndex)}>
            <td colSpan={columns.length} className="afvscr-group-cell" style={{ textIndent: ( groupPath.length - 1 ) * 1.5 + "em" }}>
                <button onClick={() => Rows.setExpandedState( groupPath, !expanded )}>
                    {expanded ? "-" : "+"}
                </button>
                &nbsp;
                {Rows.columnsByDataKey[Rows.aggregators.groups[ last ]].label}:&nbsp;{groupPath[ last ]}
                {columns.map( c => {
                    const t = totals[ c.dataKey ];
                    if( !t ){
                        return null;
                    }
                    return t.map( totalName => <span key={totalName}>{c.dataKey}_{totalName}: {TT[c.dataKey][totalName]}, </span> );
                })}
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