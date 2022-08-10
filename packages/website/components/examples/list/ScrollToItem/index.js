import { useState, memo, useLayoutEffect } from "react";
import { useVirtual, List } from "@af-utils/react-virtual-list";

const DEFAULT_ROW_COUNT = 100000;

const Item = memo(({ i, model, data: pseudoRandomSizes }) => (
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

    useLayoutEffect(() => {
        model.scrollTo(pseudoRandomSizes.length - 1);
    }, [model, pseudoRandomSizes.length]);

    const scrollSubmitHandler = e => {
        e.preventDefault();
        const idx = Number.parseInt(e.currentTarget.idx.value, 10);

        if (!Number.isNaN(idx)) {
            model.scrollTo(idx, true);
        }
    };

    const rowsAddSubmitHandler = e => {
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
        }
    };

    return (
        <div className="flex flex-col h-full">
            <form
                className="flex p-2 flex-wrap gap-4 bg-orange-100"
                onSubmit={scrollSubmitHandler}
            >
                <label>
                    Index:&nbsp;
                    <input
                        required
                        defaultValue={Math.round(pseudoRandomSizes.length / 2)}
                        name="idx"
                        className="w-[7em] py-1"
                        type="number"
                    />
                </label>
                <button className="px-4  border border-gray-500" type="submit">
                    Scroll
                </button>
            </form>
            <form
                className="flex p-2 flex-wrap gap-4 bg-green-100"
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

                <button className="px-4 border border-gray-500" type="submit">
                    Add and scroll to end
                </button>
            </form>
            <List
                model={model}
                itemData={pseudoRandomSizes}
                className="grow basis-96"
            >
                {Item}
            </List>
        </div>
    );
};

export default ScrollToItem;
