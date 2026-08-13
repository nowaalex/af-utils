import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import type { ComponentProps, ComponentType, ElementType } from "react";
import useVirtualLayout from "../../hooks/useVirtualLayout";
import useVirtualSnapshot from "../../hooks/useVirtualSnapshot";
import type { ListItemProps, ListProps } from "../../types";

const VirtualItems = <Data,>({
    model,
    Item,
    data,
    getKey
}: {
    model: ListItemProps<Data>["model"];
    Item: ComponentType<ListItemProps<Data>>;
    data: Data | undefined;
    getKey: (index: number, data: Data) => string | number;
}) => {
    useVirtualSnapshot(model, VirtualScrollerEvent.RANGE);
    return mapVirtualRange(model, index => (
        <Item
            key={getKey(index, data as Data)}
            model={model}
            index={index}
            data={data}
        />
    ));
};

/**
 * React component.
 * Small abstraction, which in 90% cases allows to avoid hook boilerplate.
 *
 * @group Components
 * @public
 */
const List = <Data = unknown, C extends ElementType = "div">(
    props: ListProps<C, Data> & Omit<ComponentProps<C>, "children" | "ref">
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
                        getKey={getKey}
                    />
                </div>
            </div>
            {footer}
        </C>
    );
};

export default List;
