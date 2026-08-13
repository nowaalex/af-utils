import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import type { ComponentType } from "preact";
import useVirtualLayout from "../../hooks/useVirtualLayout";
import useVirtualSnapshot from "../../hooks/useVirtualSnapshot";
import type { ListItemProps, ListProps } from "../../types";

/** Render only the model-owned range while isolating its subscriptions. */
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
 * Render a virtual Preact list with model-owned DOM geometry.
 *
 * @group Components
 * @public
 */
const List = <Data = unknown,>(props: ListProps<Data>) => {
    const {
        model,
        children: Item,
        itemData,
        header,
        footer,
        getKey = index => index,
        tabIndex = -1,
        style,
        ...rest
    } = props;
    const layout = useVirtualLayout(model);

    return (
        <div
            {...rest}
            ref={layout.scrollerRef}
            style={style}
            tabIndex={tabIndex}
        >
            {header}
            <div ref={layout.sizeRef}>
                <div ref={layout.itemsRef}>
                    <VirtualItems
                        model={model}
                        Item={Item}
                        data={itemData}
                        getKey={getKey}
                    />
                </div>
            </div>
            {footer}
        </div>
    );
};

export default List;
