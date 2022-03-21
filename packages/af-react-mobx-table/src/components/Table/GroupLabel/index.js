import { css } from "@af/styled";

const wrapperClass = css(
    "user-select: none",
    "margin: 0 1em"
);

const GroupLabel = ({ groupKey, columns, onRemove }) => (
    <div className={wrapperClass} onDoubleClick={onRemove}>
        {columns.find( col => col.key === groupKey ).label}
    </div>
);

export default GroupLabel