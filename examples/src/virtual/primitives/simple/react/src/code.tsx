import {
    mapVirtualRange,
    type VirtualScroller,
    VirtualScrollerEvent
} from "@af-utils/virtual-core";
import type { ListItemProps } from "@af-utils/virtual-react";
import {
    useVirtual,
    useVirtualItemRef,
    useVirtualLayout,
    useVirtualSnapshot
} from "@af-utils/virtual-react";
import { memo } from "react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ model, index }) => (
    <div
        ref={useVirtualItemRef(model, index)}
        className={css.item}
        role="listitem"
        aria-posinset={index + 1}
        aria-setsize={model.itemCount}
    >
        row {index}
    </div>
));

const Items = ({ model }: { model: VirtualScroller }) => {
    useVirtualSnapshot(model, VirtualScrollerEvent.RANGE);
    return mapVirtualRange(model, index => (
        <Item key={index} model={model} index={index} />
    ));
};

const SimpleHook = () => {
    const model = useVirtual({
        itemCount: 50000
    });

    const { sizeRef, itemsRef } = useVirtualLayout(model);

    return (
        <div
            className={css.list}
            ref={el => model.setScroller(el)}
            role="list"
            aria-label="Simple primitives list"
        >
            <div ref={sizeRef}>
                <div ref={itemsRef}>
                    <Items model={model} />
                </div>
            </div>
        </div>
    );
};

export default SimpleHook;
