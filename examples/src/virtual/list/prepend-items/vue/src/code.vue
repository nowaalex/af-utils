<script setup lang="ts">
import {
    useVirtual,
    virtualItemDirective as vVirtualItem,
    VirtualList,
    type VirtualVueElementRef
} from "@af-utils/virtual-vue";
import { ref } from "vue";
import css from "./style.module.css";

const INITIAL_ITEM_COUNT = 10_000;
const PREPEND_BATCH_SIZE = 100;
const SIMULATED_FETCH_DELAY_MS = 500;
const MIN_ITEM_PADDING_PX = 20;
const ITEM_PADDING_VARIANTS = 61;
const ITEM_PADDING_STEP = 37;
const ESTIMATED_ITEM_SIZE_PX = 120;

const createItem = (id: number) => ({
    name: id < 0 ? `Prepended person ${-id}` : `Person ${id}`,
    id,
    height:
        MIN_ITEM_PADDING_PX +
        ((Math.abs(id) * ITEM_PADDING_STEP) % ITEM_PADDING_VARIANTS)
});

const waitForPrependRequest = () =>
    new Promise<void>(resolve => {
        setTimeout(resolve, SIMULATED_FETCH_DELAY_MS);
    });

const items = ref(
    Array.from({ length: INITIAL_ITEM_COUNT }, (_, id) => createItem(id))
);
const loading = ref(false);
const model = useVirtual(() => ({
    estimatedItemSize: ESTIMATED_ITEM_SIZE_PX,
    itemCount: items.value.length
}));
const headerRef: VirtualVueElementRef = element =>
    model.setStickyHeader(element as HTMLElement | null);
let nextPrependedId = -1;

const prependItems = async () => {
    loading.value = true;
    await waitForPrependRequest();
    const newItems = Array.from({ length: PREPEND_BATCH_SIZE }, () =>
        createItem(nextPrependedId--)
    );
    const desiredScrollPosition = newItems.length + model.visibleFrom;
    model.spliceItems(0, 0, newItems.length);
    items.value.unshift(...newItems);
    model.scrollToIndex(desiredScrollPosition);
    loading.value = false;
};
</script>

<template>
    <VirtualList
        :model="model"
        :item-data="items"
        role="list"
        aria-label="Prepend items list"
    >
        <template #header>
            <div :ref="headerRef" :class="css.listHeader">
                <button
                    type="button"
                    :class="css.prependButton"
                    :disabled="loading"
                    @click="prependItems"
                >
                    Prepend {{ PREPEND_BATCH_SIZE }} items
                    {{ loading ? " (loading...)" : "" }}
                </button>
            </div>
        </template>
        <template #default="{ model: itemModel, index }">
            <div
                v-virtual-item="[itemModel, index]"
                :class="css.item"
                role="listitem"
                :aria-posinset="index + 1"
                :aria-setsize="itemModel.itemCount"
                :style="{ padding: `${items[index]?.height}px 0.5em` }"
            >
                Idx:&nbsp;{{ index }};&emsp;{{ items[index]?.name }}
            </div>
        </template>
    </VirtualList>
</template>
