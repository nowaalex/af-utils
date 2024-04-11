import { useState, memo, useEffect } from "react";
import { useVirtual, List } from "@af-utils/virtual-react";
import { VirtualScroller } from "@af-utils/virtual-core";
import type { ListItemProps } from "@af-utils/virtual-react";
import type { FormEvent } from "react";
import css from "./style.module.css";

const DEFAULT_ROW_COUNT = 50000;

const Item = memo<ListItemProps>(({ i, model, data: pseudoRandomSizes }) => (
    <div
        ref={el => model.el(i, el)}
        className={css.item}
        style={{
            padding: `${pseudoRandomSizes[i]}px 0.7em`
        }}
    >
        row {i}:&nbsp;{pseudoRandomSizes[i]}px
    </div>
));

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
        estimatedItemSize: 75
    });

    useEffect(() => {
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
            model={model}
            itemData={pseudoRandomSizes}
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
