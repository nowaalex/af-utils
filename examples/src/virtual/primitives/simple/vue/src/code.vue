<script setup lang="ts">
import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    useVirtual,
    useVirtualLayout,
    useVirtualSnapshot,
    virtualItemDirective as vVirtualItem
} from "@af-utils/virtual-vue";
import css from "./style.module.css";

const model = useVirtual({ itemCount: 50_000 });
const layout = useVirtualLayout(model);
const revision = useVirtualSnapshot(model, VirtualScrollerEvent.RANGE);
const indexes = () => {
    void revision.value;
    return mapVirtualRange(model, index => index);
};
</script>

<template>
    <div
        :ref="layout.scrollerRef"
        :class="css.list"
        role="list"
        aria-label="Simple primitives list"
    >
        <div :ref="layout.sizeRef">
            <div :ref="layout.itemsRef">
                <div
                    v-for="index in indexes()"
                    :key="index"
                    v-virtual-item="[model, index]"
                    :class="css.item"
                    role="listitem"
                    :aria-posinset="index + 1"
                    :aria-setsize="model.itemCount"
                >
                    row {{ index }}
                </div>
            </div>
        </div>
    </div>
</template>
