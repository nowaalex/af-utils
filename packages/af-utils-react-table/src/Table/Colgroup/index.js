import { memo } from "react";
import pick from "utils/pick";

const STYLE_FIELDS = ["width", "background", "border"];

const Colgroup = props => (
    <colgroup>
        {props.columns.map(column => (
            <col key={column.key} style={pick(column, STYLE_FIELDS)} />
        ))}
    </colgroup>
);

export default memo(Colgroup);
