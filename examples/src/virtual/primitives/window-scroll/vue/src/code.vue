<script setup lang="ts">
import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    useVirtual,
    useVirtualLayout,
    useVirtualSnapshot,
    virtualItemDirective as vVirtualItem
} from "@af-utils/virtual-vue";
import { computed, onMounted, onUnmounted } from "vue";
import css from "./style.module.css";

const model = useVirtual({ itemCount: 5_000 });
const layout = useVirtualLayout(model);
const revision = useVirtualSnapshot(model, VirtualScrollerEvent.RANGE);
const indexes = computed(() => {
    void revision.value;
    return mapVirtualRange(model, index => index);
});

onMounted(() => model.setScroller(window));
onUnmounted(() => model.setScroller(null));
</script>

<template>
    <div :class="css.offset1">Some offset</div>
    <div>
        <div :class="css.offset2">Some offset 2</div>
        <div>
            <div :ref="layout.sizeRef">
                <div :ref="layout.itemsRef">
                    <div
                        v-for="index in indexes"
                        :key="index"
                        v-virtual-item="[model, index]"
                        :class="css.item"
                    >
                        row {{ index }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
