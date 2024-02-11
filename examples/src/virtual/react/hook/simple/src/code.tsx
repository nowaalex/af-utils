import { memo } from "react";

import {
    useVirtual,
    Subscription,
    mapVisibleRange,
    useSyncedStyles,
    ListItemProps
} from "@af-utils/virtual-react";

import { VirtualScrollerEvent } from "@af-utils/virtual-core";

import css from "./style.module.css";

const Item = memo<ListItemProps>(({ i, model }) => (
    <div ref={el => model.el(i, el)} className={css.item}>
        row {i}
    </div>
));

const SimpleHook = () => {
    const model = useVirtual({
        itemCount: 50000
    });

    const [outerRef, innerRef] = useSyncedStyles(model);

    return (
        <div className={css.list} ref={el => model.setScroller(el)}>
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
    );
};

export default SimpleHook;