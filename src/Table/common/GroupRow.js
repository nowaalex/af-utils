import React, { memo } from "react";
import PropTypes from "prop-types";
import { getRowProps } from "../../utils/extraPropsGetters";

const GroupRow = ({ columns, groupKey, rowIndex }) => (
    <tr {...getRowProps(null,rowIndex)}>
        <td colSpan={columns.length} className="afvscr-group-cell">
            {groupKey}
        </td>
    </tr>
);

GroupRow.propTypes = {
    columns: PropTypes.array.isRequired,
    rowIndex: PropTypes.number.isRequired,
    groupKey: PropTypes.string.isRequired
};

export default memo( GroupRow );