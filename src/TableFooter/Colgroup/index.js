import React, { memo } from "react";
import { useApiPlugin } from "../../useApi";

const SUBSCRIBE_EVENTS = [
    "columns-changed"
];

const Colgroup = () => {
    const { columns } = useApiPlugin( SUBSCRIBE_EVENTS );
    return (
        <colgroup>
            {columns.map(({ dataKey, background, visibility, border }) => visibility !== "hidden" ? (
                <col
                    key={dataKey}
                    style={{
                        background,
                        border
                    }}
                />
            ) : null )}
        </colgroup>
    );
};

export default memo( Colgroup );