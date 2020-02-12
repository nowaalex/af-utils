import React, { memo } from "react";
import { useApiPlugin } from "../../useApi";

const SUBSCRIBE_EVENTS = [
    "columns-changed"
];

const TheadColgroup = memo(() => {
    const { columns } = useApiPlugin( SUBSCRIBE_EVENTS );
    return (
        <colgroup>
            {columns.map(({ dataKey, background, visibility, border }) => <col key={dataKey} style={{
                background,
                visibility,
                border
            }} /> )}
        </colgroup>
    );
}, () => true );

export default TheadColgroup;