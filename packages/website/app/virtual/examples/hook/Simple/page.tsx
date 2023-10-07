"use client";

import { memo } from "react";

import {
    useVirtual,
    Subscription,
    mapVisibleRange,
    useSyncedStyles
} from "@af-utils/virtual-react";

import { EVT_RANGE } from "@af-utils/virtual-core";
import { ListItemProps } from "@af-utils/virtual-react/lib/types";

const Item = memo<ListItemProps>(({ i, model }) => (
    <div ref={el => model.el(i, el)} className="border-t p-2 border-zinc-400">
        row {i}
    </div>
));

const SimpleHook = () => {
    const model = useVirtual({
        itemCount: 50000
    });

    const [outerRef, innerRef] = useSyncedStyles(model);

    return (
        <div className="overflow-auto contain-strict" ref={model.setScroller}>
            <div ref={outerRef}>
                <div ref={innerRef}>
                    <Subscription model={model} events={[EVT_RANGE]}>
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
