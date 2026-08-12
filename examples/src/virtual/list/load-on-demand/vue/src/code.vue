<script setup lang="ts">
import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    useVirtual,
    virtualItemDirective as vVirtualItem,
    VirtualList
} from "@af-utils/virtual-vue";
import { onMounted, onUnmounted, ref } from "vue";
import css from "./style.module.css";

const descriptionParts = [
    "Virtualized content stays responsive as the collection grows.",
    "Only the visible range is mounted and measured.",
    "This deterministic text keeps framework screenshots comparable."
];

const createDescriptions = (start: number) =>
    Array.from({ length: 5 }, (_description, offset) =>
        Array.from(
            { length: 1 + ((start + offset) % descriptionParts.length) },
            (_part, part) =>
                descriptionParts[
                    (start + offset + part) % descriptionParts.length
                ]
        ).join(" ")
    );

const fetchDescriptions = (start: number) =>
    new Promise<string[]>(resolve => {
        setTimeout(resolve, 200, createDescriptions(start));
    });

const posts = ref(createDescriptions(0));
const model = useVirtual(() => ({
    itemCount: posts.value.length,
    estimatedItemSize: 500
}));
let loading = false;
let unsubscribe = () => {};

const loadMore = async () => {
    if (loading || posts.value.length !== model.to) return;
    loading = true;
    const paragraphs = await fetchDescriptions(posts.value.length);
    loading = false;
    posts.value.push(...paragraphs);
};

onMounted(() => {
    unsubscribe = model.subscribe(
        () => void loadMore(),
        VirtualScrollerEvent.RANGE
    );
    void loadMore();
});
onUnmounted(() => unsubscribe());
</script>

<template>
    <VirtualList :model="model">
        <template #default="{ model: itemModel, index }">
            <div v-virtual-item="[itemModel, index]" :class="css.item">
                <div :class="css.itemHeader">some picture</div>
                <p>{{ posts[index] }}</p>
            </div>
        </template>
    </VirtualList>
</template>
