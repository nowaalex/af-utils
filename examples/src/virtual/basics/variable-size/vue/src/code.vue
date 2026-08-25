<script setup lang="ts">
import {
    useVirtual,
    virtualItemDirective as vVirtualItem,
    VirtualList
} from "@af-utils/virtual-vue";
import { ref } from "vue";
import css from "./style.module.css";

const DEFAULT_ROW_COUNT = 50_000;
const sizes = Array.from(
    { length: DEFAULT_ROW_COUNT },
    (_, index) => 20 + ((index ** 2) & 31)
);
const model = useVirtual({
    itemCount: DEFAULT_ROW_COUNT,
    estimatedItemSize: 75
});
const expanded = ref(false);
</script>

<template>
    <VirtualList :model="model" :class="css.list" role="list">
        <template #default="{ model: itemModel, index }">
            <div
                v-virtual-item="[itemModel, index]"
                :class="css.item"
                role="listitem"
                :aria-posinset="index + 1"
                :aria-setsize="sizes.length"
                :style="{
                    padding: `${sizes[index] + (index === 0 && expanded ? 40 : 0)}px 0`,
                    background: `hsl(${(index * 11) % 360},60%,60%)`
                }"
            >
                row {{ index }}:&nbsp;{{ sizes[index] }}px
                <button
                    v-if="index === 0"
                    type="button"
                    :class="css.toggle"
                    :aria-expanded="expanded"
                    @click="expanded = !expanded"
                >
                    Toggle first row
                </button>
            </div>
        </template>
    </VirtualList>
</template>
