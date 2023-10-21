"use client";
import { memo } from "react";

import {
    useVirtual,
    List,
    Subscription,
    ListItemProps
} from "@af-utils/virtual-react";

import { VirtualScrollerEvent } from "@af-utils/virtual-core";

const Item = memo<ListItemProps>(({ i, model }) => (
    <div ref={el => model.el(i, el)} className="border-t p-2 border-zinc-400">
        row {i}
    </div>
));

const ExtraEvents = () => {
    const rows = useVirtual({
        itemCount: 150000,
        estimatedItemSize: 45
    });

    return (
        <List
            model={rows}
            header={
                <div
                    className="flex-none text-center p-1 bg-orange-200 sticky top-0"
                    ref={el => rows.setStickyHeader(el)}
                >
                    <Subscription
                        model={rows}
                        events={[VirtualScrollerEvent.RANGE]}
                    >
                        {() => (
                            <>
                                Rendered {rows.to - rows.from} items. Range:{" "}
                                {rows.from} - {rows.to}
                            </>
                        )}
                    </Subscription>
                </div>
            }
            footer={
                <div
                    className="flex-none text-center p-1 bg-orange-200 sticky bottom-0"
                    ref={el => rows.setStickyFooter(el)}
                >
                    Scroll size:{" "}
                    <Subscription
                        model={rows}
                        events={[VirtualScrollerEvent.SCROLL_SIZE]}
                    >
                        {() => rows.scrollSize}
                    </Subscription>
                    px
                </div>
            }
        >
            {Item}
        </List>
    );
};

export default ExtraEvents;
