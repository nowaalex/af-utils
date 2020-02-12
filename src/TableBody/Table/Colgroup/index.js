import React, { memo } from "react";
import { useApiPlugin } from "../../../useApi";

const SUBSCRIBE_EVENTS = [
    "columns-changed"
];

const Colgroup = memo(() => {
    const { columns } = useApiPlugin( SUBSCRIBE_EVENTS );
    return (
        <colgroup>
            {columns.map(({ dataKey, background, visibility, border, width }) => visibility !== "hidden" ? (
                <col
                    key={dataKey}
                    style={{
                        width,
                        background,
                        border
                    }}
                />
            ) : null )}
        </colgroup>
    );
}, () => true );

export default Colgroup;