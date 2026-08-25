import { html } from "lit";
import { ref } from "lit/directives/ref.js";
import css from "./style.module.css";

interface HeaderProps {
    elementRef: (element?: Element) => void;
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

    return html`<form
        ${ref(elementRef)}
        class=${`${css.form} ${css.top0}`}
        @submit=${submit}
    >
        <label
            >Smooth scroll to index:&nbsp;<input
                required
                value=${initialIndex}
                min="0"
                max=${maxIndex}
                step="1"
                name="index"
                class=${css.inp}
                type="number"
        /></label>
        <button class=${css.btn} type="submit">Go</button>
    </form>`;
};

export default Header;
