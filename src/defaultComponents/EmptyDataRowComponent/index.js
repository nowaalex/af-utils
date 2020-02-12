import React from "react";

const EmptyDataRowComponent = ({ columns }) => (
    <tr>
        <td colSpan={columns.length}>&mdash;</td>
    </tr>
);

export default EmptyDataRowComponent;