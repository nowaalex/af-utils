<script setup lang="ts">
import type { VNodeRef } from "vue";
import css from "./style.module.css";

const { elementRef, initialIndex, maxIndex } = defineProps<{
    elementRef: VNodeRef;
    initialIndex: number;
    maxIndex: number;
}>();
const emit = defineEmits<{
    "scroll-to-index": [index: number];
}>();

const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const index = Number(
        new FormData(event.currentTarget as HTMLFormElement).get("index") ??
            Number.NaN
    );
    if (Number.isSafeInteger(index) && index >= 0 && index <= maxIndex) {
        emit("scroll-to-index", index);
    }
};
</script>

<template>
    <form :ref="elementRef" :class="[css.form, css.top0]" @submit="submit">
        <label
            >Smooth scroll to index:&nbsp;<input
                required
                :value="initialIndex"
                :min="0"
                :max="maxIndex"
                :step="1"
                name="index"
                :class="css.inp"
                type="number" /></label
        ><button :class="css.btn" type="submit">Go</button>
    </form>
</template>
