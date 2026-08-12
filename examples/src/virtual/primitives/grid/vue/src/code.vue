<script setup lang="ts">
import {
    mapVirtualRangeWithOffset,
    type VirtualScroller,
    VirtualScrollerEvent
} from "@af-utils/virtual-core";
import {
    useVirtual,
    useVirtualSnapshot,
    type VirtualVueElementRef
} from "@af-utils/virtual-vue";
import { computed, type Directive } from "vue";
import css from "./style.module.css";

const SIZE = 50_000;
const rows = useVirtual({
    itemCount: SIZE,
    estimatedItemSize: 120,
    overscanCount: 2
});
const columns = useVirtual({
    itemCount: SIZE,
    estimatedItemSize: 200,
    overscanCount: 2,
    horizontal: true
});
const rowRevision = useVirtualSnapshot(rows, VirtualScrollerEvent.ALL);
const columnRevision = useVirtualSnapshot(columns, VirtualScrollerEvent.ALL);
const cells = computed(() => {
    void rowRevision.value;
    void columnRevision.value;
    return mapVirtualRangeWithOffset(rows, (row, rowOffset) =>
        mapVirtualRangeWithOffset(columns, (column, columnOffset) => ({
            column,
            columnOffset,
            row,
            rowOffset
        }))
    ).flat();
});
const scrollerRef: VirtualVueElementRef = element => {
    rows.setScroller(element as HTMLElement | null);
    columns.setScroller(element as HTMLElement | null);
};

type GridItemBinding = readonly [row: number, column: number];
const attachGridItem = (
    element: HTMLElement,
    [row, column]: GridItemBinding
) => {
    rows.attachItem(element, row);
    columns.attachItem(element, column);
};
const detachGridItem = (element: HTMLElement) => {
    rows.detachItem(element);
    columns.detachItem(element);
};
const vVirtualGridItem: Directive<HTMLElement, GridItemBinding> = {
    mounted(element, { value }) {
        attachGridItem(element, value);
    },
    updated(element, { value, oldValue }) {
        if (oldValue?.[0] === value[0] && oldValue[1] === value[1]) return;
        detachGridItem(element);
        attachGridItem(element, value);
    },
    unmounted: detachGridItem
};

const scrollModelTo = (model: VirtualScroller, value: string) => {
    const index = Number.parseInt(value, 10);
    if (!Number.isNaN(index)) model.scrollToIndex(index, true);
};
const scrollFromForm = (event: SubmitEvent) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    scrollModelTo(
        form.get("type") === "row" ? rows : columns,
        String(form.get("index") ?? "")
    );
};
</script>

<template>
    <div :class="css.root">
        <form :class="css.form" @submit="scrollFromForm">
            <select name="type">
                <option value="row">Row</option>
                <option value="col">Col</option>
            </select>
            <input
                placeholder="index"
                type="number"
                name="index"
                :min="0"
                :max="SIZE - 1"
                class="w-28"
            />
            <button type="submit" :class="css.btn">Scroll</button>
        </form>
        <div :ref="scrollerRef" :class="css.grid">
            <div
                :class="css.gridItems"
                :style="{
                    height: `${rows.scrollSize}px`,
                    width: `${columns.scrollSize}px`
                }"
            >
                <div
                    v-for="cell in cells"
                    :key="`${cell.row}:${cell.column}`"
                    v-virtual-grid-item="[cell.row, cell.column]"
                    :class="css.cell"
                    :style="{
                        width: `${Math.max(cell.column ** 2 % 256, 190)}px`,
                        padding: `${Math.max(cell.row ** 2 % 64, 30)}px 0`,
                        transform: `translateX(${cell.columnOffset}px) translateY(${cell.rowOffset}px)`
                    }"
                >
                    <div :class="css.cellContent">
                        <span>row:</span>
                        {{ cell.row }}
                        <span>col:</span>
                        {{ cell.column }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
