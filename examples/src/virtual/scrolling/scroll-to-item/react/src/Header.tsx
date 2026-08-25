import type { FormEvent, RefCallback } from "react";
import css from "./style.module.css";

interface HeaderProps {
    elementRef: RefCallback<HTMLFormElement>;
    initialIndex: number;
    maxIndex: number;
    onScroll: (index: number) => void;
}

const Header = ({
    elementRef,
    initialIndex,
    maxIndex,
    onScroll
}: HeaderProps) => {
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const index = Number(
            new FormData(event.currentTarget).get("index") ?? Number.NaN
        );
        if (Number.isSafeInteger(index) && index >= 0 && index <= maxIndex) {
            onScroll(index);
        }
    };

    return (
        <form
            ref={elementRef}
            className={`${css.form} ${css.top0}`}
            onSubmit={submit}
        >
            <label>
                Smooth scroll to index:&nbsp;
                <input
                    required
                    defaultValue={initialIndex}
                    min={0}
                    max={maxIndex}
                    step={1}
                    name="index"
                    className={css.inp}
                    type="number"
                />
            </label>
            <button className={css.btn} type="submit">
                Go
            </button>
        </form>
    );
};

export default Header;
