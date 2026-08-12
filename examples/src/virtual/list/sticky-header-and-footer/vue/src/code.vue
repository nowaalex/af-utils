<script setup lang="ts">
import {
    useVirtual,
    virtualItemDirective as vVirtualItem,
    VirtualList,
    type VirtualVueElementRef
} from "@af-utils/virtual-vue";
import css from "./style.module.css";

const rows = useVirtual({ itemCount: 200_000 });
const headerRef: VirtualVueElementRef = element =>
    rows.setStickyHeader(element as HTMLElement | null);
const footerRef: VirtualVueElementRef = element =>
    rows.setStickyFooter(element as HTMLElement | null);
</script>

<template>
    <VirtualList
        :model="rows"
        role="list"
        aria-label="Sticky header and footer list"
    >
        <template #header>
            <div
                :ref="headerRef"
                :class="css.header"
                data-testid="sticky-header"
            >
                Header
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
            <div
                :ref="footerRef"
                :class="css.footer"
                data-testid="sticky-footer"
            >
                Footer
            </div>
        </template>
    </VirtualList>
</template>
