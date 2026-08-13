import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import { createMemo, For, splitProps } from "solid-js";
import createVirtualLayout from "../../primitives/createVirtualLayout";
import createVirtualSnapshot from "../../primitives/createVirtualSnapshot";
import type { ListItemProps, ListProps } from "../../types";

/**
 * Render a virtual Solid list with model-owned DOM geometry.
 *
 * @public
 */
const List = <Data = unknown,>(props: ListProps<Data>) => {
    const [local, rest] = splitProps(props, [
        "model",
        "children",
        "itemData",
        "header",
        "footer",
        "style",
        "tabIndex"
    ]);
    const layout = createVirtualLayout(local.model);
    const revision = createVirtualSnapshot(
        local.model,
        VirtualScrollerEvent.RANGE
    );
    const indexes = createMemo(() => {
        revision();
        return mapVirtualRange(local.model, index => index);
    });

    /** Render one range index with live access to optional item data. */
    const renderItem = (index: number) => {
        const itemProps: ListItemProps<Data> = {
            model: local.model,
            index,
            get data() {
                return local.itemData;
            }
        };

        return local.children(itemProps);
    };

    return (
        <div
            {...rest}
            ref={layout.scrollerRef}
            style={local.style}
            tabIndex={local.tabIndex ?? -1}
        >
            {local.header}
            <div ref={layout.sizeRef}>
                <div ref={layout.itemsRef}>
                    <For each={indexes()}>{renderItem}</For>
                </div>
            </div>
            {local.footer}
        </div>
    );
};

export default List;
