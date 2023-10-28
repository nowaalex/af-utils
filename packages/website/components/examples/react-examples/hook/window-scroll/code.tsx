"use client";

import { memo, useRef } from "react";

import {
    useVirtual,
    useScroller,
    useSyncedStyles,
    Subscription,
    mapVisibleRange,
    ListItemProps
} from "@af-utils/virtual-react";

import { VirtualScrollerEvent } from "@af-utils/virtual-core";

const Item = memo<ListItemProps>(({ i, model }) => (
    <div
        ref={el => model.el(i, el)}
        className="p-4 border-b border-b-slate-400"
    >
        row {i}
    </div>
));

const WindowScrollHook = () => {
    const model = useVirtual({
        itemCount: 5000
    });

    const [outerRef, innerRef] = useSyncedStyles(model);

    /*
    normally this ref is not needed; just `window` should be used instead.
    Using this temporary hack just for documentation website
    */
    const rootRef = useRef<HTMLDivElement>(null);
    useScroller(model, rootRef.current?.ownerDocument?.defaultView || null);

    return (
        <div className="h-full w-full grid" ref={rootRef}>
            <div className="py-8 px-4 bg-slate-400">Some offset</div>
            <div>
                <div className="py-16 px-4 bg-slate-500">Some offset 2</div>
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
        </div>
    );
};

export default WindowScrollHook;
