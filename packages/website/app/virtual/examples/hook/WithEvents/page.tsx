"use client";

import { memo } from "react";

import {
    useVirtual,
    mapVisibleRange,
    Subscription,
    EVT_SCROLL_SIZE,
    EVT_RANGE,
    VirtualScroller
} from "@af-utils/react-virtual-headless";

const Item = memo<{ i: number; model: VirtualScroller }>(({ i, model }) => (
    <div ref={el => model.el(i, el)} className="border-t p-2 border-zinc-400">
        row {i}
    </div>
));

const WithEvents = () => {
    const model = useVirtual({
        itemCount: 50000
    });

    return (
        <div className="h-full overflow-auto relative" ref={model.setScroller}>
            <Subscription model={model} events={[EVT_SCROLL_SIZE]}>
                {() => (
                    <div
                        className="invisible absolute top-0 left-0 w-px"
                        style={{ height: model.scrollSize }}
                    />
                )}
            </Subscription>
            <Subscription model={model} events={[EVT_RANGE]}>
                {() => (
                    <>
                        <div
                            className="invisible w-px"
                            style={{ height: model.getOffset(model.from) }}
                        />
                        {mapVisibleRange(model, i => (
                            <Item key={i} i={i} model={model} />
                        ))}
                    </>
                )}
            </Subscription>
        </div>
    );
};

export default WithEvents;
