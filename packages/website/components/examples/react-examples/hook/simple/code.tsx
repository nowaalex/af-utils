"use client";

import { memo } from "react";

import {
    useVirtual,
    Subscription,
    mapVisibleRange,
    useSyncedStyles,
    ListItemProps
} from "@af-utils/virtual-react";

import { VirtualScrollerEvent } from "@af-utils/virtual-core";

const Item = memo<ListItemProps>(({ i, model }) => (
    <div
        ref={el => model.el(i, el)}
        className="border-b p-2 border-zinc-400 last:border-none"
    >
        row {i}
    </div>
));

const SimpleHook = () => {
    const model = useVirtual({
        itemCount: 50000
    });

    const [outerRef, innerRef] = useSyncedStyles(model);

    return (
        <div
            className="overflow-auto contain-strict border border-zinc-300"
            ref={el => model.setScroller(el)}
        >
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
