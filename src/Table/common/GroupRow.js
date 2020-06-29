import React from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react-lite";
import useApi from "../../useApi";
import { getRowProps } from "../../utils/extraPropsGetters";

const GroupRow = ({ columns, groupKey, rowIndex }) => {
    const API = useApi();

    const expanded = API.Rows.expandedGroups.has( groupKey );

    return (
        <tr {...getRowProps(null,rowIndex)}>
            <td colSpan={columns.length} className="afvscr-group-cell">
                <button onClick={() => API.Rows.setExpandedState( groupKey, !expanded )}>
                    {expanded ? "-" : "+"}
                </button>
                &nbsp;
                {API.Rows.aggregators.group.dataKey}:&nbsp;
                {groupKey}
            </td>
        </tr>
    );
};

GroupRow.propTypes = {
    columns: PropTypes.array.isRequired,
    rowIndex: PropTypes.number.isRequired,
    groupKey: PropTypes.string.isRequired
};

export default observer( GroupRow );