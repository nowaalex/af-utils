import { For, splitProps } from "solid-js";
import createVirtualLayout from "../../primitives/createVirtualLayout";
import createVirtualRange from "../../primitives/createVirtualRange";
import type { ListItemProps, ListProps } from "../../types";

/**
 * Render a virtual Solid list with model-owned DOM geometry.
 *
 * @group Components
 * @public
 */
const VirtualList = <Data = unknown,>(props: ListProps<Data>) => {
    const [local, rest] = splitProps(props, [
        "model",
        "children",
        "getItemKey",
        "itemData",
        "header",
        "footer",
        "style",
        "tabIndex"
    ]);
    const layout = createVirtualLayout(local.model);
    const indexes = createVirtualRange(local.model);
    const keys = () =>
        indexes().map(index => local.getItemKey?.(index) ?? index);

    /** Render one stable item key with live access to its current index. */
    const renderItem = (_key: string | number, position: () => number) => {
        const index = () => indexes()[position()];
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
            tabIndex={local.tabIndex ?? 0}
        >
            {local.header}
            <div ref={layout.sizeRef}>
                <div ref={layout.itemsRef}>
                    <For each={keys()}>{renderItem}</For>
                </div>
            </div>
            {local.footer}
        </div>
    );
};

export default VirtualList;
