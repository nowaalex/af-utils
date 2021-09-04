import { memo } from "react";

const mapper = ({ dataKey, background, border, width }) => (
    <col
        key={dataKey}
        style={{
            width,
            background,
            border
        }}
    />
);

const Colgroup = ({ columns }) => (
    <colgroup>
        {columns.map( mapper )}
    </colgroup>
);

export default memo( Colgroup );