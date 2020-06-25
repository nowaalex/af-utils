import React from "react";
import { observer } from "mobx-react-lite";
import useApi from "../../useApi";

const Colgroup = ({ useTbodyWidths }) => {

    const { columns, tbodyColumnWidths } = useApi();

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

export default observer( Colgroup );