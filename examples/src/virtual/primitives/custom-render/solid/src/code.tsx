import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    createVirtual,
    createVirtualItemRef,
    createVirtualSnapshot
} from "@af-utils/virtual-solid";
import { createMemo, For, onCleanup, onMount } from "solid-js";
import css from "./style.module.css";

const CustomRender = () => {
    const model = createVirtual({
        itemCount: 50_000,
        estimatedItemSize: 50
    });
    const revision = createVirtualSnapshot(model, VirtualScrollerEvent.RANGE);
    const indexes = createMemo(() => {
        revision();
        return mapVirtualRange(model, index => index);
    });
    let before: HTMLDivElement | undefined;
    let after: HTMLDivElement | undefined;

    const updateSpacers = () => {
        if (!before || !after) return;
        const beforeSize = model.renderedRangeOffset;
        before.style.height = `${beforeSize}px`;
        after.style.height = `${Math.max(
            0,
            model.scrollSize - beforeSize - model.renderedRangeSize
        )}px`;
    };

    onMount(() => {
        const unsubscribe = model.subscribe(
            updateSpacers,
            VirtualScrollerEvent.RANGE |
                VirtualScrollerEvent.SCROLL_SIZE |
                VirtualScrollerEvent.SIZES
        );
        updateSpacers();
        onCleanup(unsubscribe);
    });

    return (
        <div class={css.wrapper} ref={element => model.setScroller(element)}>
            <table class={css.table}>
                <thead
                    class={css.thead}
                    ref={element => model.setStickyHeader(element)}
                >
                    <tr>
                        <th scope="col">Column one</th>
                        <th scope="col">Column two</th>
                    </tr>
                </thead>
                <tbody ref={element => model.setContainer(element)}>
                    <tr aria-hidden="true">
                        <td class={css.spacerCell} colSpan={2}>
                            <div
                                class={css.spacer}
                                ref={element => {
                                    before = element;
                                }}
                                style={{
                                    height: `${model.renderedRangeOffset}px`
                                }}
                            />
                        </td>
                    </tr>
                    <For each={indexes()}>
                        {index => (
                            <tr ref={createVirtualItemRef(model, index)}>
                                <td>Cell one - {index}</td>
                                <td>
                                    Cell two - {index}
                                    {index % 3 === 1 && (
                                        <span>Additional content</span>
                                    )}
                                    {index % 3 === 2 && (
                                        <>
                                            <span>Additional content</span>
                                            <span>One more line</span>
                                        </>
                                    )}
                                </td>
                            </tr>
                        )}
                    </For>
                    <tr aria-hidden="true">
                        <td class={css.spacerCell} colSpan={2}>
                            <div
                                class={css.spacer}
                                ref={element => {
                                    after = element;
                                }}
                                style={{
                                    height: `${Math.max(
                                        0,
                                        model.scrollSize -
                                            model.renderedRangeOffset -
                                            model.renderedRangeSize
                                    )}px`
                                }}
                            />
                        </td>
                    </tr>
                </tbody>
                <tfoot
                    class={css.tfoot}
                    ref={element => model.setStickyFooter(element)}
                >
                    <tr>
                        <td>Row one</td>
                        <td>Row two</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default CustomRender;
