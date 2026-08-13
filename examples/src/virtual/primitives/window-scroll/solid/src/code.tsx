import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    createVirtual,
    createVirtualItemRef,
    createVirtualLayout,
    createVirtualSnapshot
} from "@af-utils/virtual-solid";
import { createMemo, For, onCleanup, onMount } from "solid-js";
import css from "./style.module.css";

const WindowScroll = () => {
    const model = createVirtual({ itemCount: 5_000 });
    const layout = createVirtualLayout(model);
    const revision = createVirtualSnapshot(model, VirtualScrollerEvent.RANGE);
    const indexes = createMemo(() => {
        revision();
        return mapVirtualRange(model, index => index);
    });

    onMount(() => {
        model.setScroller(window);
        onCleanup(() => model.setScroller(null));
    });

    return (
        <>
            <div class={css.offset1}>Some offset</div>
            <div>
                <div class={css.offset2}>Some offset 2</div>
                <div>
                    <div ref={layout.sizeRef}>
                        <div ref={layout.itemsRef}>
                            <For each={indexes()}>
                                {index => (
                                    <div
                                        ref={createVirtualItemRef(model, index)}
                                        class={css.item}
                                    >
                                        row {index}
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WindowScroll;
