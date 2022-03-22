import { memo } from "react";

import {
    useVirtual,
    mapVisibleRange,
    areIndexesEqual,
    Subscription
} from "@af-utils/react-virtual-headless";

const Item = memo(
    ({ i }) => <div className="border-t p-2 border-zinc-400">row {i}</div>,
    areIndexesEqual
);

const SimpleHook = () => {
    const model = useVirtual({
        itemCount: 50000
    });

    return (
        <div className="overflow-auto" ref={model.setOuterNode}>
            <Subscription model={model}>
                {({ scrollSize, from }) => {
                    const fromOffset = model.getOffset(from);

                    const style = {
                        height: scrollSize - fromOffset,
                        marginTop: fromOffset
                    };

                    return (
                        <div style={style}>
                            <div hidden ref={model.setZeroChildNode} />
                            {mapVisibleRange(model, Item)}
                        </div>
                    );
                }}
            </Subscription>
        </div>
    );
};

export default SimpleHook;
