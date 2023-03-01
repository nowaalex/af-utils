import { memo } from "react";

import {
    useVirtual,
    mapVisibleRange,
    Subscription,
    useScroller,
    EVT_RANGE,
    EVT_SCROLL_SIZE
} from "@af-utils/react-virtual-headless";

const Item = memo(({ i, model }) => (
    <div ref={el => model.el(i, el)} className="border-t p-2 border-zinc-400">
        row {i}
    </div>
));

const DifferentScrollElementHook = () => {
    const model = useVirtual({
        itemCount: 5000
    });

    useScroller(model, typeof window === "undefined" ? null : window);

    return (
        <div>
            <div className="py-4 min-h-[20vh] bg-slate-100 text-center">
                Some offset
            </div>
            <div>
                <div className="py-4 min-h-[10vh] bg-slate-300 text-center">
                    Some offset 2
                </div>
                <div ref={model.setContainer}>
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
                                    style={{
                                        height: model.getOffset(model.from)
                                    }}
                                />
                                {mapVisibleRange(model, i => (
                                    <Item key={i} i={i} model={model} />
                                ))}
                            </>
                        )}
                    </Subscription>
                </div>
            </div>
        </div>
    );
};

export default DifferentScrollElementHook;
