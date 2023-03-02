import { memo } from "react";

import {
    useVirtual,
    mapVisibleRange,
    Subscription,
    useScroller
} from "@af-utils/react-virtual-headless";

const Item = memo(({ i, model }) => (
    <div ref={el => model.el(i, el)} className="border-t p-2 border-zinc-400">
        row {i}
    </div>
));

const DifferentScrollElementHook = () => {
    const model = useVirtual({
        itemCount: 1000,
        estimatedItemSize: 40
    });

    useScroller(model, typeof window === "undefined" ? null : window);

    return (
        <div>
            <div className="py-4 min-h-[26vh] bg-slate-100 text-center">
                Some offset
            </div>
            <div>
                <div className="py-4 min-h-[12vh] bg-slate-300 text-center">
                    Some offset 2
                </div>
                <div>
                    <Subscription model={model}>
                        {() => {
                            const fromOffset = model.getOffset(model.from);

                            return (
                                <div
                                    className="contain-strict"
                                    ref={model.setContainer}
                                    style={{
                                        height: model.scrollSize
                                    }}
                                >
                                    <div style={{ height: fromOffset }}></div>
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
