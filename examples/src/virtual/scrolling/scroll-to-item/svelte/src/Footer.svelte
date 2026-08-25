<svelte:options runes={true} />

<script lang="ts">
    import type { Attachment } from "svelte/attachments";
    import css from "./style.module.css";

    interface Props {
        attachment: Attachment<HTMLFormElement>;
        maxRowsToAdd: number;
        minRowsToAdd: number;
        onChangeRows: (rowsToAdd: number) => void;
    }

    const { attachment, maxRowsToAdd, minRowsToAdd, onChangeRows }: Props =
        $props();

    const submit = (event: SubmitEvent) => {
        event.preventDefault();
        const rowsToAdd = Number(
            new FormData(event.currentTarget as HTMLFormElement).get(
                "rowsToAdd"
            ) ?? Number.NaN
        );
        if (
            Number.isSafeInteger(rowsToAdd) &&
            rowsToAdd >= minRowsToAdd &&
            rowsToAdd <= maxRowsToAdd
        ) {
            onChangeRows(rowsToAdd);
        }
    };
</script>

<form
    {@attach attachment}
    class={`${css.form} ${css.bottom0}`}
    onsubmit={submit}
>
    <label
        >Rows to add:&nbsp;<input
            value={0}
            min={minRowsToAdd}
            max={maxRowsToAdd}
            step={1}
            type="number"
            required
            name="rowsToAdd"
            class={css.inp}
        /></label
    >
    <button class={css.btn} type="submit">Add and scroll to end</button>
</form>
