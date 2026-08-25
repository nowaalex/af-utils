import type { ListItemProps } from "@af-utils/virtual-preact";
import {
    VirtualList,
    useVirtual,
    useVirtualItemRef
} from "@af-utils/virtual-preact";
import { memo, useState } from "preact/compat";
import css from "./style.module.css";

const DEFAULT_ROW_COUNT = 50000;

interface ItemData {
    expanded: boolean;
    sizes: number[];
    toggle(): void;
}

const Item = memo<ListItemProps<ItemData>>(({ model, index, data }) => {
    const itemData = data as ItemData;
    const padding =
        itemData.sizes[index] + (index === 0 && itemData.expanded ? 40 : 0);

    return (
        <div
            ref={useVirtualItemRef(model, index)}
            className={css.item}
            role="listitem"
            aria-posinset={index + 1}
            aria-setsize={itemData.sizes.length}
            style={{
                padding: `${padding}px 0`,
                background: `hsl(${(index * 11) % 360},60%,60%)`
            }}
        >
            row {index}:&nbsp;{itemData.sizes[index]}px
            {index === 0 && (
                <button
                    className={css.toggle}
                    type="button"
                    aria-expanded={itemData.expanded}
                    onClick={itemData.toggle}
                >
                    Toggle first row
                </button>
            )}
        </div>
    );
});

const VariableSizeList = () => {
    const [expanded, setExpanded] = useState(false);
    const [pseudoRandomSizes] = useState(() =>
        Array.from(
            { length: DEFAULT_ROW_COUNT },
            (_, i) => 20 + ((i ** 2) & 31)
        )
    );

    const model = useVirtual({
        itemCount: DEFAULT_ROW_COUNT,
        estimatedItemSize: 75
    });

    return (
        <VirtualList
            className={css.list}
            model={model}
            itemData={{
                expanded,
                sizes: pseudoRandomSizes,
                toggle: () => setExpanded(value => !value)
            }}
            role="list"
        >
            {Item}
        </VirtualList>
    );
};

export default VariableSizeList;
