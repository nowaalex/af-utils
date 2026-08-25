import { html } from "lit";
import { ref } from "lit/directives/ref.js";
import css from "./style.module.css";

interface FooterProps {
    elementRef: (element?: Element) => void;
    maxRowsToAdd: number;
    minRowsToAdd: number;
    onChangeRows: (rowsToAdd: number) => void;
}

const Footer = ({
    elementRef,
    maxRowsToAdd,
    minRowsToAdd,
    onChangeRows
}: FooterProps) => {
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

    return html`<form
        ${ref(elementRef)}
        class=${`${css.form} ${css.bottom0}`}
        @submit=${submit}
    >
        <label
            >Rows to add:&nbsp;<input
                value="0"
                min=${minRowsToAdd}
                max=${maxRowsToAdd}
                step="1"
                type="number"
                required
                name="rowsToAdd"
                class=${css.inp}
        /></label>
        <button class=${css.btn} type="submit">Add and scroll to end</button>
    </form>`;
};

export default Footer;
