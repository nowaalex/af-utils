import { memo } from "react";

import {
    useVirtual,
    mapVisibleRange,
    areItemPropsEqual,
    Subscription
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

const SimpleHook = () => {
    const model = useVirtual({
        itemCount: 50000
    });

    return (
        <div className="overflow-auto" ref={model.setOuterNode}>
            <Subscription
                model={model}
                getHash={() =>
                    model.from + "_" + model.to + "_" + model.scrollSize
                }
            >
                {({ scrollSize, from }) => {
                    const fromOffset = model.getOffset(from);

                    return (
                        <div
                            style={{
                                height: scrollSize - fromOffset,
                                marginTop: fromOffset
                            }}
                        >
                            {mapVisibleRange(model, Item)}
                        </div>
                    );
                }}
            </Subscription>
        </div>
    );
};

export default SimpleHook;
