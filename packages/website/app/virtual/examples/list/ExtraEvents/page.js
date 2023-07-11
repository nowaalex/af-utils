"use client";

import { memo } from "react";
import {
    useVirtual,
    List,
    EVT_RANGE,
    EVT_SCROLL_SIZE,
    Subscription
} from "@af-utils/react-virtual-list";

const Item = memo(({ i, model }) => (
    <div ref={el => model.el(i, el)} className="border-t p-2 border-zinc-400">
        row {i}
    </div>
));

const ExtraEvents = () => {
    const rows = useVirtual({
        itemCount: 250000,
        estimatedItemSize: 45,
        /*
            Such a big overscanCount is rarely needed;
            just for example here
        */
        overscanCount: 10
    });

    return (
        <List
            className="h-full"
            model={rows}
            header={
                <div
                    className="flex-none text-center p-1 bg-orange-200 sticky top-0"
                    ref={el => rows.setStickyHeader(el)}
                >
                    <Subscription model={rows} events={[EVT_RANGE]}>
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
                    <Subscription model={rows} events={[EVT_SCROLL_SIZE]}>
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
