<script setup lang="ts">
import type { VirtualScroller } from "@af-utils/virtual-core";
import {
    useVirtual,
    virtualItemDirective as vVirtualItem,
    VirtualList,
    type VirtualVueElementRef
} from "@af-utils/virtual-vue";
import { ref, watch } from "vue";
import Footer from "./Footer.vue";
import Header from "./Header.vue";
import css from "./style.module.css";

const DEFAULT_ROW_COUNT = 50_000;
const MAX_ROW_COUNT = 100_000;
const sizes = ref(
    Array.from(
        { length: DEFAULT_ROW_COUNT },
        (_, index) => 20 + ((index ** 2) & 31)
    )
);
const model = useVirtual(() => ({
    itemCount: sizes.value.length,
    estimatedItemSize: 78
}));
const headerRef: VirtualVueElementRef = element =>
    model.setStickyHeader(element instanceof HTMLElement ? element : null);
const footerRef: VirtualVueElementRef = element =>
    model.setStickyFooter(element instanceof HTMLElement ? element : null);

watch(
    () => sizes.value.length,
    length => model.scrollToIndex(length - 1),
    { flush: "post", immediate: true }
);

const changeRows = (rowsToAdd: number) => {
    if (rowsToAdd !== 0) {
        sizes.value =
            rowsToAdd > 0
                ? sizes.value.concat(
                      Array.from(
                          { length: rowsToAdd },
                          (_, index) => 50 + ((index ** 2) & 63)
                      )
                  )
                : sizes.value.slice(0, rowsToAdd);
    } else {
        model.scrollToIndex(sizes.value.length - 1);
    }
};

const itemStyle = (index: number) => ({
    padding: `${sizes.value[index]}px 0.7em`
});
const itemAriaSize = (_model: VirtualScroller) => sizes.value.length;
</script>

<template>
    <VirtualList :model="model" :class="css.list" role="list" tabindex="-1">
        <template #header>
            <Header
                :element-ref="headerRef"
                :initial-index="Math.round(sizes.length / 2)"
                :max-index="sizes.length - 1"
                @scroll-to-index="
                    index => model.scrollToIndex(index, { behavior: 'smooth' })
                "
            />
        </template>
        <template #default="{ model: itemModel, index }">
            <div
                v-virtual-item="[itemModel, index]"
                :class="css.item"
                role="listitem"
                :aria-posinset="index + 1"
                :aria-setsize="itemAriaSize(itemModel)"
                :style="itemStyle(index)"
            >
                row {{ index }}:&nbsp;{{ sizes[index] }}px
            </div>
        </template>
        <template #footer>
            <Footer
                :element-ref="footerRef"
                :min-rows-to-add="1 - sizes.length"
                :max-rows-to-add="MAX_ROW_COUNT - sizes.length"
                @change-rows="changeRows"
            />
        </template>
    </VirtualList>
</template>
