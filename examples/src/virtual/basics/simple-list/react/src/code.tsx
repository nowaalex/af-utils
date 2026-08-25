import type { ListItemProps } from "@af-utils/virtual-react";
import {
    VirtualList,
    useVirtual,
    useVirtualItemRef
} from "@af-utils/virtual-react";
import { memo } from "react";

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
        <VirtualList model={rows} role="list" aria-label="Simple virtual list">
            {Item}
        </VirtualList>
    );
};

export default SimpleList;
