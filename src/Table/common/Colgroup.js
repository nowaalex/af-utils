import React from "react";
import { observer } from "mobx-react-lite";
import useApi from "../../useApi";

const Colgroup = ({ useTbodyWidths }) => {

    const { normalizedVisibleColumns, tbodyColumnWidths } = useApi();

    return (
        <colgroup>
            {normalizedVisibleColumns.map(({ dataKey, background, visibility, border, width }, j ) => (
                <col
                    key={dataKey}
                    style={{
                        width: useTbodyWidths ? tbodyColumnWidths[ j ] : width,
                        background,
                        border
                    }}
                />
            ))}
        </colgroup>
    );
};

export default observer( Colgroup );