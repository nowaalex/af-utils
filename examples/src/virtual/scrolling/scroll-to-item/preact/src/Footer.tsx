import type { FormEvent } from "preact/compat";
import css from "./style.module.css";

interface FooterProps {
    elementRef: (element: HTMLFormElement | null) => void;
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
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const rowsToAdd = Number(
            new FormData(event.currentTarget).get("rowsToAdd") ?? Number.NaN
        );
        if (
            Number.isSafeInteger(rowsToAdd) &&
            rowsToAdd >= minRowsToAdd &&
            rowsToAdd <= maxRowsToAdd
        ) {
            onChangeRows(rowsToAdd);
        }
    };

    return (
        <form
            ref={elementRef}
            className={`${css.form} ${css.bottom0}`}
            onSubmit={submit}
        >
            <label>
                Rows to add:&nbsp;
                <input
                    defaultValue={0}
                    min={minRowsToAdd}
                    max={maxRowsToAdd}
                    step={1}
                    type="number"
                    required
                    name="rowsToAdd"
                    className={css.inp}
                />
            </label>
            <button className={css.btn} type="submit">
                Add and scroll to end
            </button>
        </form>
    );
};

export default Footer;
