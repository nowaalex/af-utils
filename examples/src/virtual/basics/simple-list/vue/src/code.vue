<script setup lang="ts">
import {
    useVirtual,
    virtualItemDirective as vVirtualItem,
    VirtualList
} from "@af-utils/virtual-vue";

const rows = useVirtual({ itemCount: 150_000 });
</script>

<template>
    <VirtualList :model="rows" role="list" aria-label="Simple virtual list">
        <template #default="{ model, index }">
            <div
                v-virtual-item="[model, index]"
                role="listitem"
                :aria-posinset="index + 1"
                :aria-setsize="model.itemCount"
                style="border-top: 2px solid #ccc; padding: 0.6em"
            >
                row {{ index }}
            </div>
        </template>
    </VirtualList>
</template>
