import React, { memo } from "react";
import { useApiPlugin } from "../useApi";

const SUBSCRIBE_EVENTS = [
    "columns-changed"
];

const TbodyColgroup = memo(() => {
    const { columns } = useApiPlugin( SUBSCRIBE_EVENTS );
    return (
        <colgroup>
            {columns.map(({ dataKey, background, visibility, border, width }) => <col key={dataKey} style={{
                width,
                background,
                visibility,
                border
            }} /> )}
        </colgroup>
    );
}, () => true );

export default TbodyColgroup;