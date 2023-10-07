import { mapVisibleRange } from "utils/rangeMappers";
import useSyncedStyles from "hooks/useSyncedStyles";
import Subscription from "components/Subscription";
import { EVT_RANGE } from "@af-utils/virtual-core";
import type { ElementType } from "react";
import type { ListProps } from "types";

const List = <T extends ElementType = "div">({
    model,
    children: Item,
    itemData,
    component,
    header = null,
    footer = null,
    getKey = (i: number) => i,
    tabIndex = -1,
    style,
    ...props
}: ListProps<T>) => {
    const Component = component || "div";
    const [outerRef, innerRef] = useSyncedStyles(model);

    return (
        <Component
            {...props}
            style={{
                overflow: "auto",
                contain: "strict",
                ...style
            }}
            ref={model.setScroller}
            tabIndex={tabIndex}
        >
            {header}
            <div ref={outerRef}>
                <div ref={innerRef}>
                    <Subscription model={model} events={[EVT_RANGE]}>
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
        </Component>
    );
};

export default List;
