import type { VirtualScroller } from "@af-utils/virtual-core";
import type { ListItemProps } from "@af-utils/virtual-react";
import { List, useVirtual, useVirtualItemRef } from "@af-utils/virtual-react";
import type { FormEvent } from "react";
import { memo, useEffect, useLayoutEffect, useState } from "react";
import css from "./style.module.css";

const DEFAULT_ROW_COUNT = 50000;
const useBrowserLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;

const Item = memo<ListItemProps<number[]>>(({ model, index, data }) => {
    const sizes = data as number[];

    return (
        <div
            ref={useVirtualItemRef(model, index)}
            className={css.item}
            role="listitem"
            aria-posinset={index + 1}
            aria-setsize={sizes.length}
            style={{
                padding: `${sizes[index]}px 0.7em`
            }}
        >
            row {index}:&nbsp;{sizes[index]}px
        </div>
    );
});

const getScrollSubmitHandler =
    (model: VirtualScroller) => (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const idx = Number.parseInt(e.currentTarget.idx.value, 10);

        if (!Number.isNaN(idx)) {
            model.scrollToIndex(idx, true);
        }
    };

const ScrollToItem = () => {
    const [pseudoRandomSizes, changeRows] = useState(() =>
        Array.from(
            { length: DEFAULT_ROW_COUNT },
            (_, i) => 20 + ((i ** 2) & 31)
        )
    );

    const model = useVirtual({
        itemCount: pseudoRandomSizes.length,
        estimatedItemSize: 78
    });

    useBrowserLayoutEffect(() => {
        model.scrollToIndex(pseudoRandomSizes.length - 1);
    }, [model, pseudoRandomSizes.length]);

    const rowsAddSubmitHandler = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const rowsToAdd = Number.parseInt(e.currentTarget.rowsToAdd.value, 10);

        if (!Number.isNaN(rowsToAdd) && rowsToAdd !== 0) {
            changeRows(rows =>
                rowsToAdd > 0
                    ? rows.concat(
                          Array.from(
                              { length: rowsToAdd },
                              (_, i) => 50 + ((i ** 2) & 63)
                          )
                      )
                    : rows.slice(0, rowsToAdd)
            );
        } else {
            model.scrollToIndex(pseudoRandomSizes.length - 1);
        }
    };

    return (
        <List
            className={css.list}
            model={model}
            itemData={pseudoRandomSizes}
            role="list"
            header={
                <form
                    className={`${css.form} ${css.top0}`}
                    ref={el => model.setStickyHeader(el)}
                    onSubmit={getScrollSubmitHandler(model)}
                >
                    <label>
                        Smooth scroll to index:&nbsp;
                        <input
                            required
                            defaultValue={Math.round(
                                pseudoRandomSizes.length / 2
                            )}
                            name="idx"
                            className={css.inp}
                            type="number"
                        />
                    </label>
                    <button className={css.btn} type="submit">
                        Go
                    </button>
                </form>
            }
            footer={
                <form
                    ref={el => model.setStickyFooter(el)}
                    className={`${css.form} ${css.bottom0}`}
                    onSubmit={rowsAddSubmitHandler}
                >
                    <label>
                        Rows to add:&nbsp;
                        <input
                            defaultValue={0}
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
            }
        >
            {Item}
        </List>
    );
};

export default ScrollToItem;
