import { memo } from "react";

import {
    useVirtual,
    mapVisibleRange,
    Subscription
} from "@af-utils/react-virtual-headless";

const Item = memo(({ i, model }) => (
    <div ref={el => model.el(i, el)} className="border-t p-2 border-zinc-400">
        row {i}
    </div>
));

const DifferentScrollElementHook = () => {
    const model = useVirtual({
        itemCount: 50000
    });

    return (
        <div className="h-full overflow-auto" ref={model.setScrollElement}>
            <Subscription model={model}>
                {() => {
                    const fromOffset = model.getOffset(model.from);

                    return (
                        <div
                            style={{
                                height: model.scrollSize - fromOffset,
                                marginTop: fromOffset
                            }}
                        >
                            {mapVisibleRange(model, i => (
                                <Item key={i} model={model} i={i} />
                            ))}
                        </div>
                    );
                }}
            </Subscription>
        </div>
    );
};

export default DifferentScrollElementHook;
