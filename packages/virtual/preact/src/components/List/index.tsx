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
 * Render a virtual Preact list with model-owned DOM geometry.
 *
 * @group Components
 * @public
 */
const VirtualList = <Data = unknown,>(props: ListProps<Data>) => {
    const {
        model,
        children: Item,
        getItemKey = index => index,
        itemData,
        header,
        footer,
        tabIndex = 0,
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
                        getItemKey={getItemKey}
                    />
                </div>
            </div>
            {footer}
        </div>
    );
};

export default VirtualList;
