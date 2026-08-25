<script setup lang="ts">
import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    useVirtual,
    useVirtualSnapshot,
    virtualItemDirective as vVirtualItem,
    VirtualList,
    type VirtualVueElementRef
} from "@af-utils/virtual-vue";
import { computed } from "vue";
import css from "./style.module.css";

const rows = useVirtual({ itemCount: 150_000, estimatedItemSize: 35 });
const rangeRevision = useVirtualSnapshot(rows, VirtualScrollerEvent.RANGE);
const scrollSizeRevision = useVirtualSnapshot(
    rows,
    VirtualScrollerEvent.SCROLL_SIZE
);
const rangeInfo = computed(() => {
    void rangeRevision.value;
    return `Rendered ${rows.to - rows.from} items. Range: ${rows.from} - ${rows.to}`;
});
const scrollSize = computed(() => {
    void scrollSizeRevision.value;
    return rows.scrollSize;
});
const headerRef: VirtualVueElementRef = element =>
    rows.setStickyHeader(element instanceof HTMLElement ? element : null);
const footerRef: VirtualVueElementRef = element =>
    rows.setStickyFooter(element instanceof HTMLElement ? element : null);
</script>

<template>
    <VirtualList :model="rows" role="list" aria-label="Extra events list">
        <template #header>
            <div :ref="headerRef" :class="[css.row, css.top0]">
                {{ rangeInfo }}
            </div>
        </template>
        <template #default="{ model, index }">
            <div
                v-virtual-item="[model, index]"
                :class="css.item"
                role="listitem"
                :aria-posinset="index + 1"
                :aria-setsize="model.itemCount"
            >
                row {{ index }}
            </div>
        </template>
        <template #footer>
            <div :ref="footerRef" :class="[css.row, css.bottom0]">
                Scroll size: {{ scrollSize }}px
            </div>
        </template>
    </VirtualList>
</template>
