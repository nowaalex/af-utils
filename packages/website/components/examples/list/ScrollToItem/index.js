import { useState, memo, useLayoutEffect } from "react";
import { useVirtual, List } from "@af-utils/react-virtual-list";
import times from "lodash/times";
import { faker } from "@faker-js/faker";
import useFakerSeed from "/hooks/useFakerSeed";

const DEFAULT_ROW_COUNT = 4096;

const Item = memo(({ i, model, data: dynamicListRowHeights }) => (
    <div
        ref={el => model.el(i, el)}
        className="text-center border-t border-zinc-400"
        style={{
            lineHeight: `${dynamicListRowHeights[i]}px`
        }}
    >
        row {i}:&nbsp;{dynamicListRowHeights[i]}px
    </div>
));

const getEstimatedItemSize = (oldItemSizes, oldScrollSize) =>
    oldItemSizes.length ? Math.round(oldScrollSize / oldItemSizes.length) : 75;

const ScrollToItem = () => {
    // fake data should be consistent for ssr purpose
    useFakerSeed(1234);

    const [dynamicListRowHeights, changeRows] = useState(() =>
        times(DEFAULT_ROW_COUNT, () => faker.mersenne.rand(140, 30))
    );

    const model = useVirtual({
        itemCount: dynamicListRowHeights.length,
        getEstimatedItemSize
    });

    useLayoutEffect(() => {
        model.scrollTo(dynamicListRowHeights.length - 1);
    }, [model, dynamicListRowHeights.length]);

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
                          times(rowsToAdd, () => faker.mersenne.rand(140, 30))
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
                        defaultValue={Math.round(
                            dynamicListRowHeights.length / 2
                        )}
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
                itemData={dynamicListRowHeights}
                className="grow basis-96"
            >
                {Item}
            </List>
        </div>
    );
};

export default ScrollToItem;
