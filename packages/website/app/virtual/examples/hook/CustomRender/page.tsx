"use client";

import { memo, useState, useLayoutEffect } from "react";

import {
    useVirtual,
    Subscription,
    mapVisibleRange,
    ListItemProps
} from "@af-utils/virtual-react";

import { Event } from "@af-utils/virtual-core";

const Item = memo<ListItemProps>(({ i, model }) => (
    <tr ref={el => model.el(i, el)}>
        <td>Cell one - {i}</td>
        <td>Cell two - {i}</td>
    </tr>
));

const CustomRender = () => {
    const model = useVirtual({
        itemCount: 50000
    });

    const [before, beforeRef] = useState<HTMLElement | null>(null);
    const [after, afterRef] = useState<HTMLElement | null>(null);

    useLayoutEffect(() => {
        if (before && after) {
            const unsubBefore = model.on(() => {
                before.style.height = model.getOffset(model.from) + "px";
            }, [Event.RANGE]);

            const unsubAfter = model.on(() => {
                after.style.height =
                    model.scrollSize - model.getOffset(model.to) + "px";
            }, [Event.RANGE, Event.SCROLL_SIZE, Event.SIZES]);

            return () => {
                unsubBefore();
                unsubAfter();
            };
        }
    }, [model, before, after]);

    return (
        <div
            className="overflow-auto relative border contain-strict"
            ref={model.setScroller}
        >
            <table className="w-full basic-table-container text-center border-separate border-spacing-0">
                <thead
                    className="sticky top-0 bg-white"
                    ref={el => model.setStickyHeader(el)}
                >
                    <tr>
                        <td>Row one</td>
                        <td>Row two</td>
                    </tr>
                </thead>
                <tbody>
                    <tr className="contain-strict" ref={beforeRef}>
                        <td className="!p-0 !border-y-0" />
                        <td className="!p-0 !border-y-0" />
                    </tr>
                    <Subscription model={model} events={[Event.RANGE]}>
                        {() =>
                            mapVisibleRange(model, i => (
                                <Item key={i} i={i} model={model} />
                            ))
                        }
                    </Subscription>
                    <tr className="contain-strict" ref={afterRef}>
                        <td className="!p-0 !border-y-0" />
                        <td className="!p-0 !border-y-0" />
                    </tr>
                </tbody>
                <tfoot
                    className="sticky bottom-0 bg-white"
                    ref={el => model.setStickyFooter(el)}
                >
                    <tr>
                        <td>Row one</td>
                        <td>Row two</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default CustomRender;
