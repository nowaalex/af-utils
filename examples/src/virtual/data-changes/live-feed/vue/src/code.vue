<script setup lang="ts">
import {
    useVirtual,
    virtualItemDirective as vVirtualItem,
    VirtualList
} from "@af-utils/virtual-vue";
import { nextTick, onMounted, ref, watch } from "vue";
import css from "./style.module.css";

interface Message {
    id: number;
    padding: number;
    text: string;
}

const INITIAL_COUNT = 200;
const createMessage = (id: number): Message => ({
    id,
    padding: 8 + ((id * 13) % 18),
    text: `Message ${id}`
});

const messages = ref(
    Array.from({ length: INITIAL_COUNT }, (_, id) => createMessage(id))
);
const model = useVirtual(() => ({
    estimatedItemSize: 52,
    itemCount: messages.value.length
}));
const getItemKey = (index: number) => messages.value[index]?.id ?? index;
let shouldFollowEnd = true;

const scrollToEnd = () => model.scrollToIndex(messages.value.length - 1);
const appendMessage = () => {
    shouldFollowEnd = model.to === model.itemCount;
    messages.value.push(createMessage(messages.value.length));
};

watch(
    () => messages.value.length,
    async () => {
        await nextTick();
        if (shouldFollowEnd) scrollToEnd();
    }
);
onMounted(scrollToEnd);
</script>

<template>
    <div :class="css.example">
        <div :class="css.toolbar">
            <button type="button" @click="appendMessage">Append message</button>
            <button type="button" @click="scrollToEnd">Jump to latest</button>
            <output :class="css.status">{{ messages.length }} messages</output>
        </div>
        <VirtualList
            :class="css.list"
            :model="model"
            :get-item-key="getItemKey"
            role="list"
            aria-label="Live message feed"
        >
            <template #default="{ model: itemModel, index }">
                <div
                    v-virtual-item="[itemModel, index]"
                    :class="css.item"
                    role="listitem"
                    :aria-posinset="index + 1"
                    :aria-setsize="messages.length"
                    :style="{ paddingBlock: `${messages[index].padding}px` }"
                >
                    {{ messages[index].text }}
                </div>
            </template>
        </VirtualList>
    </div>
</template>
