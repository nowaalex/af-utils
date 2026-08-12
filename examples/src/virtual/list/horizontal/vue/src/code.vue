<script setup lang="ts">
import {
    useVirtual,
    virtualItemDirective as vVirtualItem,
    VirtualList
} from "@af-utils/virtual-vue";
import css from "./style.module.css";

const columns = useVirtual({
    itemCount: 50_000,
    estimatedItemSize: 75,
    horizontal: true
});
</script>

<template>
    <VirtualList :model="columns">
        <template #default="{ model, index }">
            <div
                v-virtual-item="[model, index]"
                :class="index % 2 ? css.oddItem : css.evenItem"
            >
                col&nbsp;{{ index }}
            </div>
        </template>
    </VirtualList>
</template>
