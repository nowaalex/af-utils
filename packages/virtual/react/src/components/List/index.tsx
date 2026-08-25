import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import type { ComponentProps, ComponentType, ElementType } from "react";
import useVirtualLayout from "../../hooks/useVirtualLayout";
import useVirtualSnapshot from "../../hooks/useVirtualSnapshot";
import type { ListItemProps, ListProps } from "../../types";

const VirtualItems = <Data,>({
    model,
    Item,
    data,
    getItemKey
}: {
    model: ListItemProps<Data>["model"];
    Item: ComponentType<ListItemProps<Data>>;
    data: Data | undefined;
    getItemKey: (index: number) => string | number;
}) => {
    useVirtualSnapshot(model, VirtualScrollerEvent.RANGE);
    return mapVirtualRange(model, index => (
        <Item key={getItemKey(index)} model={model} index={index} data={data} />
    ));
};

/**
 * React component.
 * Small abstraction, which in 90% cases allows to avoid hook boilerplate.
 *
 * @group Components
 * @public
 */
const VirtualList = <Data = unknown, C extends ElementType = "div">(
    props: ListProps<C, Data> & Omit<ComponentProps<C>, "children" | "ref">
) => {
    const {
        model,
        children: Item,
        getItemKey = index => index,
        itemData,
        component: C = "div",
        header = null,
        footer = null,
        tabIndex = 0,
        style,
        ...rest
    } = props;

    const { scrollerRef, sizeRef, itemsRef } = useVirtualLayout(model);

    return (
        <C {...rest} style={style} ref={scrollerRef} tabIndex={tabIndex}>
            {header}
            <div ref={sizeRef}>
                <div ref={itemsRef}>
                    <VirtualItems
                        model={model}
                        Item={Item}
                        data={itemData}
                        getItemKey={getItemKey}
                    />
                </div>
            </div>
            {footer}
        </C>
    );
};

export default VirtualList;
