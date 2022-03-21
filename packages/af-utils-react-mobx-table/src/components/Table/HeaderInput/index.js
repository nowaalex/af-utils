import { observer } from "mobx-react-lite";
import { css } from "@af-utils/styled";

const wrapperClass = css(
    "outline: none",
    "box-sizing: border-box",
    "width: 100%",
    "min-width: 0",
    "margin-top: 0.3em"
);

const HeaderInput = ({ m, column }) => m.compact ? null : (
    <input
        className={wrapperClass}
        value={m.filtersMap.get( column.key  )||""}
        onChange={e => m.setFiltering( column.key , e.target.value )}
    />
);

export default observer( HeaderInput );