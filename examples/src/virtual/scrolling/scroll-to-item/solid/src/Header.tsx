import css from "./style.module.css";

interface HeaderProps {
    elementRef: (element: HTMLFormElement) => void;
    initialIndex: number;
    maxIndex: number;
    onScroll: (index: number) => void;
}

const Header = (props: HeaderProps) => (
    <form
        ref={props.elementRef}
        class={`${css.form} ${css.top0}`}
        onSubmit={event => {
            event.preventDefault();
            const index = Number(
                new FormData(event.currentTarget).get("index") ?? Number.NaN
            );
            if (
                Number.isSafeInteger(index) &&
                index >= 0 &&
                index <= props.maxIndex
            ) {
                props.onScroll(index);
            }
        }}
    >
        <label>
            Smooth scroll to index:&nbsp;
            <input
                required
                value={props.initialIndex}
                min={0}
                max={props.maxIndex}
                step={1}
                name="index"
                class={css.inp}
                type="number"
            />
        </label>
        <button class={css.btn} type="submit">
            Go
        </button>
    </form>
);

export default Header;
