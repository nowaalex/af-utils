import { memo } from "react";
import {
    useVirtual,
    useScroller,
    useSyncedStyles,
    Subscription,
    mapVisibleRange,
    createListItemRef
} from "@af-utils/virtual-react";
import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import type { ListItemProps } from "@af-utils/virtual-react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ model, i }) => (
    <div ref={createListItemRef(model, i)} className={css.item}>
        row {i}
    </div>
));

const WindowScrollHook = () => {
    const model = useVirtual({
        itemCount: 5000
    });

    const [outerRef, innerRef] = useSyncedStyles(model);

    useScroller(model, typeof window === "undefined" ? null : window);

    return (
        <>
            <div className={css.offset1}>Some offset</div>
            <div>
                <div className={css.offset2}>Some offset 2</div>
                <div ref={el => model.setContainer(el)}>
                    <div ref={outerRef}>
                        <div ref={innerRef}>
                            <Subscription
                                model={model}
                                events={[VirtualScrollerEvent.RANGE]}
                            >
                                {() =>
                                    mapVisibleRange(model, i => (
                                        <Item key={i} model={model} i={i} />
                                    ))
                                }
                            </Subscription>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WindowScrollHook;
