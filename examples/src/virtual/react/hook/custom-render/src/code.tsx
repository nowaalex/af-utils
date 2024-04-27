import { memo, useState, useEffect, useLayoutEffect } from "react";
import {
    useVirtual,
    Subscription,
    mapVisibleRange,
    createListItemRef
} from "@af-utils/virtual-react";
import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import type { ListItemProps } from "@af-utils/virtual-react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ model, i }) => (
    <tr ref={createListItemRef(model, i)}>
        <td>Cell one - {i}</td>
        <td>Cell two - {i}</td>
    </tr>
));

// Needed for server side rendering. Otherwise useLayoutEffect could be used
const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

const CustomRender = () => {
    const model = useVirtual({
        itemCount: 50000
    });

    const [before, beforeRef] = useState<HTMLElement | null>(null);
    const [after, afterRef] = useState<HTMLElement | null>(null);

    useIsomorphicLayoutEffect(() => {
        if (model && before && after) {
            const updateBeforeStyle = () => {
                before.style.height = model.getOffset(model.from) + "px";
            };

            const updateAfterStyle = () => {
                after.style.height =
                    model.scrollSize - model.getOffset(model.to) + "px";
            };

            const unsubBefore = model.on(updateBeforeStyle, [
                VirtualScrollerEvent.RANGE
            ]);

            const unsubAfter = model.on(updateAfterStyle, [
                VirtualScrollerEvent.RANGE,
                VirtualScrollerEvent.SCROLL_SIZE,
                VirtualScrollerEvent.SIZES
            ]);

            updateBeforeStyle();
            updateAfterStyle();

            return () => {
                unsubBefore();
                unsubAfter();
            };
        }
    }, [model, before, after]);

    return (
        <div className={css.wrapper} ref={el => model.setScroller(el)}>
            <table className={css.table}>
                <thead
                    className={css.thead}
                    ref={el => model.setStickyHeader(el)}
                >
                    <tr>
                        <td>Row one</td>
                        <td>Row two</td>
                    </tr>
                </thead>
                <tbody>
                    <tr className={css.spaceTr} ref={beforeRef}>
                        <td />
                        <td />
                    </tr>
                    <Subscription
                        model={model}
                        events={[VirtualScrollerEvent.RANGE]}
                    >
                        {() =>
                            mapVisibleRange(model, i => (
                                <Item key={i} i={i} model={model} />
                            ))
                        }
                    </Subscription>
                    <tr className={css.spaceTr} ref={afterRef}>
                        <td />
                        <td />
                    </tr>
                </tbody>
                <tfoot
                    className={css.tfoot}
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
