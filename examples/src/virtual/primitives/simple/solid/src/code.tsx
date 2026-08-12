import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    createVirtual,
    createVirtualItemRef,
    createVirtualLayout,
    createVirtualSnapshot
} from "@af-utils/virtual-solid";
import { createMemo, For } from "solid-js";
import css from "./style.module.css";

const PrimitiveList = () => {
    const model = createVirtual({ itemCount: 50_000 });
    const layout = createVirtualLayout(model);
    const revision = createVirtualSnapshot(model, VirtualScrollerEvent.RANGE);
    const indexes = createMemo(() => {
        revision();
        return mapVirtualRange(model, index => index);
    });

    return (
        <div
            ref={layout.scrollerRef}
            style={layout.scrollerStyle}
            class={css.list}
            role="list"
            aria-label="Simple primitives list"
        >
            <div ref={layout.sizeRef} style={layout.sizeStyle}>
                <div ref={layout.itemsRef} style={layout.itemsStyle}>
                    <For each={indexes()}>
                        {index => (
                            <div
                                ref={createVirtualItemRef(model, index)}
                                class={css.item}
                                role="listitem"
                                aria-posinset={index + 1}
                                aria-setsize={model.itemCount}
                            >
                                row {index}
                            </div>
                        )}
                    </For>
                </div>
            </div>
        </div>
    );
};

export default PrimitiveList;
