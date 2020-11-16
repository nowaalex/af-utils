import { memo } from "react";
import useModelSubscription from "hooks/useModelSubscription";

const COLGROUP_SUBSCRIPTIONS = [ "normalizedVisibleColumns" ];

const Colgroup = () => {

    const { normalizedVisibleColumns } = useModelSubscription( COLGROUP_SUBSCRIPTIONS );

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

export default memo( Colgroup, () => true );