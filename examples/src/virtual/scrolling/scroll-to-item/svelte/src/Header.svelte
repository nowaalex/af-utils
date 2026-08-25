<svelte:options runes={true} />

<script lang="ts">
    import type { Attachment } from "svelte/attachments";
    import css from "./style.module.css";

    interface Props {
        attachment: Attachment<HTMLFormElement>;
        initialIndex: number;
        maxIndex: number;
        onScroll: (index: number) => void;
    }

    const { attachment, initialIndex, maxIndex, onScroll }: Props = $props();

    const submit = (event: SubmitEvent) => {
        event.preventDefault();
        const index = Number(
            new FormData(event.currentTarget as HTMLFormElement).get("index") ??
                Number.NaN
        );
        if (Number.isSafeInteger(index) && index >= 0 && index <= maxIndex) {
            onScroll(index);
        }
    };
</script>

<form {@attach attachment} class={`${css.form} ${css.top0}`} onsubmit={submit}>
    <label
        >Smooth scroll to index:&nbsp;<input
            required
            value={initialIndex}
            min={0}
            max={maxIndex}
            step={1}
            name="index"
            class={css.inp}
            type="number"
        /></label
    >
    <button class={css.btn} type="submit">Go</button>
</form>
