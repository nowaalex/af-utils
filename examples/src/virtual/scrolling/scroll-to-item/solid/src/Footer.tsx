import css from "./style.module.css";

interface FooterProps {
    elementRef: (element: HTMLFormElement) => void;
    maxRowsToAdd: number;
    minRowsToAdd: number;
    onChangeRows: (rowsToAdd: number) => void;
}

const Footer = (props: FooterProps) => (
    <form
        ref={props.elementRef}
        class={`${css.form} ${css.bottom0}`}
        onSubmit={event => {
            event.preventDefault();
            const rowsToAdd = Number(
                new FormData(event.currentTarget).get("rowsToAdd") ?? Number.NaN
            );
            if (
                Number.isSafeInteger(rowsToAdd) &&
                rowsToAdd >= props.minRowsToAdd &&
                rowsToAdd <= props.maxRowsToAdd
            ) {
                props.onChangeRows(rowsToAdd);
            }
        }}
    >
        <label>
            Rows to add:&nbsp;
            <input
                value={0}
                min={props.minRowsToAdd}
                max={props.maxRowsToAdd}
                step={1}
                type="number"
                required
                name="rowsToAdd"
                class={css.inp}
            />
        </label>
        <button class={css.btn} type="submit">
            Add and scroll to end
        </button>
    </form>
);

export default Footer;
