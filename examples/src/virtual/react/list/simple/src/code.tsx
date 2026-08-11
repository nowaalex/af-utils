import { memo } from "react";
import { useVirtual, List, useVirtualItemRef } from "@af-utils/virtual-react";
import type { ListItemProps } from "@af-utils/virtual-react";

const Item = memo<ListItemProps>(({ model, index }) => (
    <div
        ref={useVirtualItemRef(model, index)}
        style={{ borderTop: "2px solid #ccc", padding: "0.6em" }}
    >
        row {index}
    </div>
));

const SimpleList = () => {
    const rows = useVirtual({
        itemCount: 150000
    });

    return <List model={rows}>{Item}</List>;
};

export default SimpleList;
