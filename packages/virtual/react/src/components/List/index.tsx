import { mapVisibleRange } from "utils/rangeMappers";
import useSyncedStyles from "hooks/useSyncedStyles";
import Subscription from "components/Subscription";
import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import { useCallback, ElementType } from "react";
import type { ListProps } from "types";
import type { ComponentProps } from "react";

/**
 * @public
 * React component.
 * Small abstraction, which in 90% cases allows to avoid hook boilerplate.
 */
const List = <C extends ElementType = "div">(
    props: ListProps<C> & Omit<ComponentProps<C>, "children" | "ref">
) => {
    const {
        model,
        children: Item,
        itemData,
        component: C = "div",
        header = null,
        footer = null,
        getKey = (i: number) => i,
        tabIndex = -1,
        style,
        ...rest
    } = props;

    const [outerRef, innerRef] = useSyncedStyles(model);

    return (
        <C
            {...rest}
            style={{
                overflow: "auto",
                contain: "strict",
                ...style
            }}
            ref={useCallback(
                (el: HTMLElement | null) => model.setScroller(el),
                [model]
            )}
            tabIndex={tabIndex}
        >
            {header}
            <div ref={outerRef}>
                <div ref={innerRef}>
                    <Subscription
                        model={model}
                        events={[VirtualScrollerEvent.RANGE]}
                    >
                        {() =>
                            mapVisibleRange(model, i => (
                                <Item
                                    key={getKey(i, itemData)}
                                    model={model}
                                    i={i}
                                    data={itemData}
                                />
                            ))
                        }
                    </Subscription>
                </div>
            </div>
            {footer}
        </C>
    );
};

export default List;
