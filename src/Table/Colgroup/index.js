import React from "react";
import { observer } from "mobx-react-lite";
import useApi from "../../useApi";

const Colgroup = () => {

    const { normalizedVisibleColumns } = useApi();

    return (
        <colgroup>
            {normalizedVisibleColumns.map(({ dataKey, background, border, width }) => (
                <col
                    key={dataKey}
                    style={{
                        width,
                        background,
                        border
                    }}
                />
            ))}
        </colgroup>
    );
};

export default observer( Colgroup );