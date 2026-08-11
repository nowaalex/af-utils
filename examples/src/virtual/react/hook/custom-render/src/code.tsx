import { memo, useState, useEffect, useLayoutEffect } from "react";
import {
    useVirtual,
    useVirtualSnapshot,
    useVirtualItemRef
} from "@af-utils/virtual-react";
import {
    mapVirtualRange,
    VirtualScrollerEvent,
    type VirtualScroller
} from "@af-utils/virtual-core";
import type { ListItemProps } from "@af-utils/virtual-react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ model, index }) => (
    <tr ref={useVirtualItemRef(model, index)}>
        <td>Cell one - {index}</td>
        <td>Cell two - {index}</td>
    </tr>
));

const Items = ({ model }: { model: VirtualScroller }) => {
    useVirtualSnapshot(model, VirtualScrollerEvent.RANGE);
    return mapVirtualRange(model, index => (
        <Item key={index} index={index} model={model} />
    ));
};

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

            const unsubBefore = model.subscribe(
                updateBeforeStyle,
                VirtualScrollerEvent.RANGE
            );

            const unsubAfter = model.subscribe(
                updateAfterStyle,
                VirtualScrollerEvent.RANGE |
                    VirtualScrollerEvent.SCROLL_SIZE |
                    VirtualScrollerEvent.SIZES
            );

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
                    <Items model={model} />
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
