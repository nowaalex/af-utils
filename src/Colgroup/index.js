import React, { memo } from "react";

const Colgroup = memo(({ columns, widthsArray }) => (
    <colgroup>
        {columns.map(({ dataKey, background, visibility, border, width }, i ) => <col key={dataKey} style={{
            width: widthsArray ? widthsArray[ i ] : width,
            background,
            visibility,
            border
        }} /> )}
    </colgroup>
));

export default Colgroup;