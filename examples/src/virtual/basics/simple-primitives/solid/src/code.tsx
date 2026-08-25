import {
    createVirtual,
    createVirtualItemRef,
    createVirtualLayout,
    createVirtualRange
} from "@af-utils/virtual-solid";
import { For } from "solid-js";
import css from "./style.module.css";

const PrimitiveList = () => {
    const model = createVirtual({ itemCount: 50_000 });
    const layout = createVirtualLayout(model);
    const indexes = createVirtualRange(model);

    return (
        <div
            ref={layout.scrollerRef}
            class={css.list}
            role="list"
            aria-label="Simple primitives list"
        >
            <div ref={layout.sizeRef}>
                <div ref={layout.itemsRef}>
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
