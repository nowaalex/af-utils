import React, { memo } from "react";
import { useApiPlugin } from "../useApi";

const SUBSCRIBE_EVENTS = [
    "columns-changed",
    "column-widths-changed"
];

const TheadColgroup = memo(() => {
    const { columns, tbodyColumnWidths } = useApiPlugin( SUBSCRIBE_EVENTS );
    return (
        <colgroup>
            {columns.map(({ dataKey, background, visibility, border, width }, i ) => <col key={dataKey} style={{
                width: tbodyColumnWidths[ i ] || width,
                background,
                visibility,
                border
            }} /> )}
        </colgroup>
    );
}, () => true );

export default TheadColgroup;