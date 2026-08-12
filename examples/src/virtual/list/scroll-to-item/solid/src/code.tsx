import type { VirtualScroller } from "@af-utils/virtual-core";
import {
    createVirtual,
    createVirtualItemRef,
    List,
    type ListItemProps
} from "@af-utils/virtual-solid";
import { createEffect, createSignal } from "solid-js";
import css from "./style.module.css";

const DEFAULT_ROW_COUNT = 50_000;

const Item = (props: ListItemProps<number[]>) => (
    <div
        ref={createVirtualItemRef(props.model, props.index)}
        class={css.item}
        role="listitem"
        aria-posinset={props.index + 1}
        aria-setsize={props.data?.length}
        style={{ padding: `${props.data?.[props.index]}px 0.7em` }}
    >
        row {props.index}:&nbsp;{props.data?.[props.index]}px
    </div>
);

const scrollFromForm = (model: VirtualScroller, form: HTMLFormElement) => {
    const index = Number.parseInt(
        String(new FormData(form).get("index") ?? ""),
        10
    );
    if (!Number.isNaN(index)) model.scrollToIndex(index, true);
};

const ScrollToItem = () => {
    const [sizes, setSizes] = createSignal(
        Array.from(
            { length: DEFAULT_ROW_COUNT },
            (_, index) => 20 + ((index ** 2) & 31)
        )
    );
    const model = createVirtual(() => ({
        itemCount: sizes().length,
        estimatedItemSize: 78
    }));

    createEffect(() => model.scrollToIndex(sizes().length - 1));

    const changeRows = (form: HTMLFormElement) => {
        const rowsToAdd = Number.parseInt(
            String(new FormData(form).get("rowsToAdd") ?? ""),
            10
        );
        if (!Number.isNaN(rowsToAdd) && rowsToAdd !== 0) {
            setSizes(current =>
                rowsToAdd > 0
                    ? current.concat(
                          Array.from(
                              { length: rowsToAdd },
                              (_, index) => 50 + ((index ** 2) & 63)
                          )
                      )
                    : current.slice(0, rowsToAdd)
            );
        } else {
            model.scrollToIndex(sizes().length - 1);
        }
    };

    return (
        <List
            class={css.list}
            model={model}
            itemData={sizes()}
            role="list"
            header={
                <form
                    class={`${css.form} ${css.top0}`}
                    ref={element => model.setStickyHeader(element)}
                    onSubmit={event => {
                        event.preventDefault();
                        scrollFromForm(model, event.currentTarget);
                    }}
                >
                    <label>
                        Smooth scroll to index:&nbsp;
                        <input
                            required
                            value={Math.round(sizes().length / 2)}
                            name="index"
                            class={css.inp}
                            type="number"
                        />
                    </label>
                    <button class={css.btn} type="submit">
                        Go
                    </button>
                </form>
            }
            footer={
                <form
                    ref={element => model.setStickyFooter(element)}
                    class={`${css.form} ${css.bottom0}`}
                    onSubmit={event => {
                        event.preventDefault();
                        changeRows(event.currentTarget);
                    }}
                >
                    <label>
                        Rows to add:&nbsp;
                        <input
                            value={0}
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
            }
        >
            {Item}
        </List>
    );
};

export default ScrollToItem;
