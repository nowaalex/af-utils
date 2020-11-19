import { memo } from "react";

const Colgroup = ({ columns }) => (
    <colgroup>
        {columns.map(({ dataKey, background, border, width }) => (
            <col
                key={dataKey}
                style={{
                    width,
                    background,
                    border
                }}
            />
        ))}
    </colgroup>
);

export default memo( Colgroup );