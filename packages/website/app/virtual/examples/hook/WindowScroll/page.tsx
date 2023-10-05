"use client";

import { memo, useState } from "react";
import { createPortal } from "react-dom";
import {
    useVirtual,
    useScroller,
    mapVisibleRange,
    Subscription,
    VirtualScroller
} from "@af-utils/react-virtual-headless";

const Item = memo<{ i: number; model: VirtualScroller }>(({ i, model }) => (
    <div ref={el => model.el(i, el)} className="border-t p-2 border-zinc-400">
        row {i}
    </div>
));

const WindowScrollHook = ({
    contentWindow
}: {
    contentWindow: HTMLIFrameElement["contentWindow"];
}) => {
    const model = useVirtual({
        itemCount: 5000
    });

    useScroller(model, contentWindow || null);

    return (
        <>
            <div className="py-4 min-h-[20vh] bg-slate-100 text-center">
                Some offset
            </div>
            <div>
                <div className="py-4 min-h-[10vh] bg-slate-300 text-center">
                    Some offset 2
                </div>
                <div ref={model.setContainer}>
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
        </>
    );
};

const IframeWrapper = () => {
    const [ref, setRef] = useState<HTMLIFrameElement | null>(null);

    const contentWindow = ref?.contentWindow;

    return (
        <iframe className="w-full h-full" ref={setRef}>
            {contentWindow &&
                createPortal(
                    <WindowScrollHook contentWindow={contentWindow} />,
                    contentWindow.document.body
                )}
        </iframe>
    );
};

export default IframeWrapper;
