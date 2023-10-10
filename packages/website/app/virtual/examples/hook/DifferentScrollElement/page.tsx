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
    <div ref={el => model.el(i, el)} className="border-t p-2 border-zinc-400">
        row {i}
    </div>
));

const DifferentScrollElementHook = () => {
    const model = useVirtual({
        itemCount: 5000
    });

    const [outerRef, innerRef] = useSyncedStyles(model);

    /*
        for window scroll use this instead of model.setScroller:
        useScroller( model, window );
    */

    return (
        <div className="overflow-auto" ref={model.setScroller}>
            <div className="py-4 min-h-[20vh] bg-slate-100 text-center">
                Some offset
            </div>
            <div>
                <div className="py-4 min-h-[10vh] bg-slate-300 text-center">
                    Some offset 2
                </div>
                <div ref={model.setContainer}>
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
        </div>
    );
};

export default DifferentScrollElementHook;
