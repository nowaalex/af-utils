import { memo } from "react";

import {
    useVirtual,
    mapVisibleRange,
    areItemPropsEqual,
    Subscription,
    EVT_SCROLL_SIZE,
    EVT_FROM,
    EVT_TO
} from "@af-utils/react-virtual-headless";

const Item = memo(
    ({ i, model }) => (
        <div
            ref={el => model.el(i, el)}
            className="border-t p-2 border-zinc-400"
        >
            row {i}
        </div>
    ),
    areItemPropsEqual
);

const RANGE_EVENTS = [EVT_FROM, EVT_TO];
const SCROLL_SIZE_EVENTS = [EVT_SCROLL_SIZE];

const WithEvents = () => {
    const model = useVirtual({
        itemCount: 50000
    });

    return (
        <div
            className="overflow-auto relative will-change-scroll"
            ref={model.setOuterNode}
        >
            <Subscription model={model} events={SCROLL_SIZE_EVENTS}>
                {({ scrollSize: height }) => (
                    <div
                        className="invisible absolute top-0 left-0 w-px"
                        style={{ height }}
                    />
                )}
            </Subscription>
            <Subscription model={model} events={RANGE_EVENTS}>
                {({ from }) => (
                    <>
                        <div
                            className="invisible w-px"
                            style={{ height: model.getOffset(from) }}
                        />
                        {mapVisibleRange(model, Item)}
                    </>
                )}
            </Subscription>
        </div>
    );
};

export default WithEvents;
