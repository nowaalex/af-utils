<script setup lang="ts">
import type { VNodeRef } from "vue";
import css from "./style.module.css";

const { elementRef, maxRowsToAdd, minRowsToAdd } = defineProps<{
    elementRef: VNodeRef;
    maxRowsToAdd: number;
    minRowsToAdd: number;
}>();
const emit = defineEmits<{
    "change-rows": [rowsToAdd: number];
}>();

const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const rowsToAdd = Number(
        new FormData(event.currentTarget as HTMLFormElement).get("rowsToAdd") ??
            Number.NaN
    );
    if (
        Number.isSafeInteger(rowsToAdd) &&
        rowsToAdd >= minRowsToAdd &&
        rowsToAdd <= maxRowsToAdd
    ) {
        emit("change-rows", rowsToAdd);
    }
};
</script>

<template>
    <form :ref="elementRef" :class="[css.form, css.bottom0]" @submit="submit">
        <label
            >Rows to add:&nbsp;<input
                :value="0"
                :min="minRowsToAdd"
                :max="maxRowsToAdd"
                :step="1"
                type="number"
                required
                name="rowsToAdd"
                :class="css.inp" /></label
        ><button :class="css.btn" type="submit">Add and scroll to end</button>
    </form>
</template>
