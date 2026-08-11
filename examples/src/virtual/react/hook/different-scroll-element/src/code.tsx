import { memo } from "react";
import {
    useVirtual,
    useVirtualSnapshot,
    useVirtualLayout,
    useVirtualItemRef
} from "@af-utils/virtual-react";
import {
    mapVirtualRange,
    VirtualScrollerEvent,
    type VirtualScroller
} from "@af-utils/virtual-core";
import type { ListItemProps } from "@af-utils/virtual-react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ model, index }) => (
    <div ref={useVirtualItemRef(model, index)} className={css.item}>
        row {index}
    </div>
));

const Items = ({ model }: { model: VirtualScroller }) => {
    useVirtualSnapshot(model, VirtualScrollerEvent.RANGE);
    return mapVirtualRange(model, index => (
        <Item key={index} model={model} index={index} />
    ));
};

const DifferentScrollElementHook = () => {
    const model = useVirtual({
        itemCount: 5000
    });

    const { sizeRef, itemsRef } = useVirtualLayout(model);

    return (
        <div className={css.list} ref={el => model.setScroller(el)}>
            <div className={css.offset1}>Some offset</div>
            <div>
                <div className={css.offset2}>Some offset 2</div>
                <div>
                    <div ref={sizeRef}>
                        <div ref={itemsRef}>
                            <Items model={model} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DifferentScrollElementHook;
