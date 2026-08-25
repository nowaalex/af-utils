<script setup lang="ts">
import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    useVirtual,
    useVirtualSnapshot,
    virtualItemDirective as vVirtualItem,
    type VirtualVueElementRef
} from "@af-utils/virtual-vue";
import { computed } from "vue";
import css from "./style.module.css";

const model = useVirtual({ itemCount: 50_000, estimatedItemSize: 50 });
const revision = useVirtualSnapshot(model, VirtualScrollerEvent.ALL);
const indexes = computed(() => {
    void revision.value;
    return mapVirtualRange(model, index => index);
});
const beforeSize = computed(() => {
    void revision.value;
    return model.renderedRangeOffset;
});
const afterSize = computed(() => {
    void revision.value;
    return Math.max(
        0,
        model.scrollSize - model.renderedRangeOffset - model.renderedRangeSize
    );
});
const scrollerRef: VirtualVueElementRef = element =>
    model.setScroller(element instanceof HTMLElement ? element : null);
const containerRef: VirtualVueElementRef = element =>
    model.setContainer(element instanceof HTMLElement ? element : null);
const headerRef: VirtualVueElementRef = element =>
    model.setStickyHeader(element instanceof HTMLElement ? element : null);
const footerRef: VirtualVueElementRef = element =>
    model.setStickyFooter(element instanceof HTMLElement ? element : null);
</script>

<template>
    <div :ref="scrollerRef" :class="css.wrapper">
        <table :class="css.table">
            <thead :ref="headerRef" :class="css.thead">
                <tr>
                    <th scope="col">Column one</th>
                    <th scope="col">Column two</th>
                </tr>
            </thead>
            <tbody :ref="containerRef">
                <tr aria-hidden="true">
                    <td :class="css.spacerCell" colspan="2">
                        <div
                            :class="css.spacer"
                            :style="{ height: `${beforeSize}px` }"
                        />
                    </td>
                </tr>
                <tr
                    v-for="index in indexes"
                    :key="index"
                    v-virtual-item="[model, index]"
                >
                    <td>Cell one - {{ index }}</td>
                    <td>
                        Cell two - {{ index }}
                        <span v-if="index % 3 === 1">Additional content</span>
                        <template v-if="index % 3 === 2">
                            <span>Additional content</span>
                            <span>One more line</span>
                        </template>
                    </td>
                </tr>
                <tr aria-hidden="true">
                    <td :class="css.spacerCell" colspan="2">
                        <div
                            :class="css.spacer"
                            :style="{ height: `${afterSize}px` }"
                        />
                    </td>
                </tr>
            </tbody>
            <tfoot :ref="footerRef" :class="css.tfoot">
                <tr>
                    <td>Row one</td>
                    <td>Row two</td>
                </tr>
            </tfoot>
        </table>
    </div>
</template>
