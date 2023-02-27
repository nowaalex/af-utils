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
        itemCount: 50000,
        overscanCount: 0
    });

    return (
        <div
            className="h-full overflow-auto contain-strict"
            ref={model.setScrollElement}
        >
            <div className="py-4 min-h-[20vh] bg-slate-100 text-center">
                Some offset
            </div>
            <div>
                <div className="py-4 min-h-[10vh] bg-slate-300 text-center">
                    Some offset 2
                </div>
                <div ref={model.setInitialElement}>
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
            </div>
        </div>
    );
};

export default DifferentScrollElementHook;
