"use client";

import { memo, useState } from "react";
import { createPortal } from "react-dom";

import {
    useVirtual,
    useScroller,
    useSyncedStyles,
    Subscription,
    mapVisibleRange,
    ListItemProps
} from "@af-utils/virtual-react";

import { VirtualScrollerEvent } from "@af-utils/virtual-core";

const Item = memo<ListItemProps>(({ i, model }) => (
    <div
        ref={el => model.el(i, el)}
        style={{ borderTop: "1px solid #ccc", padding: "1em" }}
    >
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
    const [outerRef, innerRef] = useSyncedStyles(model);

    return (
        <>
            <div style={{ lineHeight: 4, padding: "1em", background: "#ccc" }}>
                Some offset
            </div>
            <div>
                <div
                    style={{
                        lineHeight: 8,
                        padding: "1em",
                        background: "#999"
                    }}
                >
                    Some offset 2
                </div>
                <div ref={el => model.setContainer(el)}>
                    <div ref={outerRef}>
                        <div ref={innerRef}>
                            <Subscription
                                model={model}
                                events={[VirtualScrollerEvent.RANGE]}
                            >
                                {() =>
                                    mapVisibleRange(model, i => (
                                        <Item key={i} model={model} i={i} />
                                    ))
                                }
                            </Subscription>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const IframeWrapper = () => {
    const [ref, setRef] = useState<HTMLIFrameElement | null>(null);

    const contentWindow = ref?.contentWindow;

    if (contentWindow) {
        contentWindow.document.body.style.margin = "0";
    }

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
