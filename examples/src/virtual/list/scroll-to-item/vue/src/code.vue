<script setup lang="ts">
import type { VirtualScroller } from "@af-utils/virtual-core";
import {
    useVirtual,
    virtualItemDirective as vVirtualItem,
    VirtualList,
    type VirtualVueElementRef
} from "@af-utils/virtual-vue";
import { ref, watch } from "vue";
import css from "./style.module.css";

const DEFAULT_ROW_COUNT = 50_000;
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
    model.setStickyHeader(element as HTMLElement | null);
const footerRef: VirtualVueElementRef = element =>
    model.setStickyFooter(element as HTMLElement | null);

watch(
    () => sizes.value.length,
    length => model.scrollToIndex(length - 1),
    { flush: "post", immediate: true }
);

const scrollFromForm = (event: SubmitEvent) => {
    event.preventDefault();
    const index = Number.parseInt(
        String(
            new FormData(event.currentTarget as HTMLFormElement).get("index") ??
                ""
        ),
        10
    );
    if (!Number.isNaN(index)) model.scrollToIndex(index, true);
};

const changeRows = (event: SubmitEvent) => {
    event.preventDefault();
    const rowsToAdd = Number.parseInt(
        String(
            new FormData(event.currentTarget as HTMLFormElement).get(
                "rowsToAdd"
            ) ?? ""
        ),
        10
    );
    if (!Number.isNaN(rowsToAdd) && rowsToAdd !== 0) {
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
            <form
                :ref="headerRef"
                :class="[css.form, css.top0]"
                @submit="scrollFromForm"
            >
                <label
                    >Smooth scroll to index:&nbsp;<input
                        required
                        :value="Math.round(sizes.length / 2)"
                        name="index"
                        :class="css.inp"
                        type="number" /></label
                ><button :class="css.btn" type="submit">Go</button>
            </form>
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
            <form
                :ref="footerRef"
                :class="[css.form, css.bottom0]"
                @submit="changeRows"
            >
                <label
                    >Rows to add:&nbsp;<input
                        :value="0"
                        type="number"
                        required
                        name="rowsToAdd"
                        :class="css.inp" /></label
                ><button :class="css.btn" type="submit">
                    Add and scroll to end
                </button>
            </form>
        </template>
    </VirtualList>
</template>
