import { memo } from "react";
import { useVirtual, List, createListItemRef } from "@af-utils/virtual-react";
import type { ListItemProps } from "@af-utils/virtual-react";

const Item = memo<ListItemProps>(({ model, i }) => (
    <div
        ref={createListItemRef(model, i)}
        style={{ borderTop: "1px solid #ccc", padding: "0.5em" }}
    >
        row {i}
    </div>
));

const SimpleList = () => {
    const rows = useVirtual({
        itemCount: 150000
    });

    return <List model={rows}>{Item}</List>;
};

export default SimpleList;
