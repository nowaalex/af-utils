import {
    mapVirtualRange,
    type VirtualScroller,
    VirtualScrollerEvent
} from "@af-utils/virtual-core";
import type { ListItemProps } from "@af-utils/virtual-react";
import {
    useScroller,
    useVirtual,
    useVirtualItemRef,
    useVirtualLayout,
    useVirtualSnapshot
} from "@af-utils/virtual-react";
import { memo } from "react";
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

const WindowScrollHook = () => {
    const model = useVirtual({
        itemCount: 5000
    });

    const { sizeRef, itemsRef } = useVirtualLayout(model);

    useScroller(model, typeof window === "undefined" ? null : window);

    return (
        <>
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
        </>
    );
};

export default WindowScrollHook;
