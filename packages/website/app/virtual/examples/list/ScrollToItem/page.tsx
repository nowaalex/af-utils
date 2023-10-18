"use client";

import { useState, memo, useEffect, FormEvent } from "react";
import { useVirtual, List, ListItemProps } from "@af-utils/virtual-react";

const DEFAULT_ROW_COUNT = 1000;

const Item = memo<ListItemProps>(({ i, model, data: pseudoRandomSizes }) => (
    <div
        ref={el => model.el(i, el)}
        className="text-center border-t border-zinc-400"
        style={{
            lineHeight: `${pseudoRandomSizes[i]}px`
        }}
    >
        row {i}:&nbsp;{pseudoRandomSizes[i]}px
    </div>
));

const ScrollToItem = () => {
    const [pseudoRandomSizes, changeRows] = useState(() =>
        Array.from(
            { length: DEFAULT_ROW_COUNT },
            (_, i) => 50 + ((i ** 2) & 63)
        )
    );

    const model = useVirtual({
        itemCount: pseudoRandomSizes.length,
        estimatedItemSize: 75
    });

    useEffect(() => {
        model.scrollToIndex(pseudoRandomSizes.length - 1);
    }, [model, pseudoRandomSizes.length]);

    const scrollSubmitHandler = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const idx = Number.parseInt(e.currentTarget.idx.value, 10);

        if (!Number.isNaN(idx)) {
            model.scrollToIndex(idx, true);
        }
    };

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
            className="grow basis-96 h-full"
            header={
                <form
                    className="flex justify-center p-2 flex-wrap gap-4 bg-orange-100 sticky top-0"
                    ref={el => model.setStickyHeader(el)}
                    onSubmit={scrollSubmitHandler}
                >
                    <label>
                        Smooth scroll to index:&nbsp;
                        <input
                            required
                            defaultValue={Math.round(
                                pseudoRandomSizes.length / 2
                            )}
                            name="idx"
                            className="w-[7em] py-1"
                            type="number"
                        />
                    </label>
                    <button
                        className="px-4 border border-gray-700 bg-gray-200 hover:bg-gray-300"
                        type="submit"
                    >
                        Go
                    </button>
                </form>
            }
            footer={
                <form
                    ref={el => model.setStickyFooter(el)}
                    className="flex justify-center p-2 flex-wrap gap-4 bg-green-100 sticky bottom-0"
                    onSubmit={rowsAddSubmitHandler}
                >
                    <label>
                        Rows to add:&nbsp;
                        <input
                            defaultValue={0}
                            type="number"
                            required
                            name="rowsToAdd"
                            className="w-[5em] py-1"
                        />
                    </label>

                    <button
                        className="px-4 border border-gray-700 bg-gray-200 hover:bg-gray-300"
                        type="submit"
                    >
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
