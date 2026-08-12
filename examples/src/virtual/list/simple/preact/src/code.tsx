import type { ListItemProps } from "@af-utils/virtual-preact";
import { List, useVirtual, useVirtualItemRef } from "@af-utils/virtual-preact";
import { memo } from "preact/compat";

const Item = memo<ListItemProps>(({ model, index }) => (
    <div
        ref={useVirtualItemRef(model, index)}
        role="listitem"
        aria-posinset={index + 1}
        aria-setsize={model.itemCount}
        style={{ borderTop: "2px solid #ccc", padding: "0.6em" }}
    >
        row {index}
    </div>
));

const SimpleList = () => {
    const rows = useVirtual({
        itemCount: 150000
    });

    return (
        <List model={rows} role="list" aria-label="Simple virtual list">
            {Item}
        </List>
    );
};

export default SimpleList;
