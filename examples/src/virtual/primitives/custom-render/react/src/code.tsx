import {
    mapVirtualRange,
    type VirtualScroller,
    VirtualScrollerEvent
} from "@af-utils/virtual-core";
import type { ListItemProps } from "@af-utils/virtual-react";
import {
    useVirtual,
    useVirtualItemRef,
    useVirtualSnapshot
} from "@af-utils/virtual-react";
import { memo, useEffect, useLayoutEffect, useRef } from "react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ model, index }) => (
    <tr ref={useVirtualItemRef(model, index)}>
        <td>Cell one - {index}</td>
        <td>
            Cell two - {index}
            {index % 3 === 1 && <span>Additional content</span>}
            {index % 3 === 2 && (
                <>
                    <span>Additional content</span>
                    <span>One more line</span>
                </>
            )}
        </td>
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
        itemCount: 50000,
        estimatedItemSize: 50
    });
    const beforeRef = useRef<HTMLDivElement>(null);
    const afterRef = useRef<HTMLDivElement>(null);

    useIsomorphicLayoutEffect(() => {
        const before = beforeRef.current;
        const after = afterRef.current;

        if (!before || !after) return;

        const updateSpacers = () => {
            const beforeSize = model.renderedRangeOffset;
            const rangeSize = model.renderedRangeSize;

            before.style.height = `${beforeSize}px`;
            after.style.height = `${Math.max(
                0,
                model.scrollSize - beforeSize - rangeSize
            )}px`;
        };

        const unsubscribe = model.subscribe(
            updateSpacers,
            VirtualScrollerEvent.RANGE |
                VirtualScrollerEvent.SCROLL_SIZE |
                VirtualScrollerEvent.SIZES
        );

        updateSpacers();
        return unsubscribe;
    }, [model]);

    const initialBeforeSize = model.renderedRangeOffset;
    const initialAfterSize = Math.max(
        0,
        model.scrollSize - initialBeforeSize - model.renderedRangeSize
    );

    return (
        <div
            className={css.wrapper}
            ref={element => model.setScroller(element)}
        >
            <table className={css.table}>
                <thead
                    className={css.thead}
                    ref={el => model.setStickyHeader(el)}
                >
                    <tr>
                        <th scope="col">Column one</th>
                        <th scope="col">Column two</th>
                    </tr>
                </thead>
                <tbody ref={element => model.setContainer(element)}>
                    <tr aria-hidden="true">
                        <td className={css.spacerCell} colSpan={2}>
                            <div
                                className={css.spacer}
                                ref={beforeRef}
                                style={{ height: initialBeforeSize }}
                            />
                        </td>
                    </tr>
                    <Items model={model} />
                    <tr aria-hidden="true">
                        <td className={css.spacerCell} colSpan={2}>
                            <div
                                className={css.spacer}
                                ref={afterRef}
                                style={{ height: initialAfterSize }}
                            />
                        </td>
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
