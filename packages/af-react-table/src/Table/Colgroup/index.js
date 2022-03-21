import { memo } from "react";

const Colgroup = ({ columns }) => (
    <colgroup>
        {columns.map(({ key, background, border, width }) => (
            <col
                key={key}
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