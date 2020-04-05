import React, { memo } from "react";
import useApiPlugin from "../../useApi";

const commonSubscribeEvents = [ "#columns" ];
const nonStickySubscribeEvents = commonSubscribeEvents.concat( "tbody-column-widths-changed" );

const Colgroup = ({ useTbodyWidths }) => {

    const { columns, tbodyColumnWidths } = useApiPlugin( useTbodyWidths ? nonStickySubscribeEvents : commonSubscribeEvents );

    return (
        <colgroup>
            {columns.map(({ dataKey, background, visibility, border, width }, j ) => visibility !== "hidden" ? (
                <col
                    key={dataKey}
                    style={{
                        width: useTbodyWidths ? tbodyColumnWidths[ j ] : width,
                        background,
                        border
                    }}
                />
            ) : null )}
        </colgroup>
    );
};

export default memo( Colgroup );