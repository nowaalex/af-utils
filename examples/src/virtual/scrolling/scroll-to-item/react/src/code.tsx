import type { ListItemProps } from "@af-utils/virtual-react";
import {
    VirtualList,
    useVirtual,
    useVirtualItemRef
} from "@af-utils/virtual-react";
import { memo, useEffect, useLayoutEffect, useState } from "react";
import Footer from "./Footer";
import Header from "./Header";
import css from "./style.module.css";

const DEFAULT_ROW_COUNT = 50000;
const MAX_ROW_COUNT = 100_000;
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

    const changeRowCount = (rowsToAdd: number) => {
        if (rowsToAdd !== 0) {
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
        <VirtualList
            className={css.list}
            model={model}
            itemData={pseudoRandomSizes}
            role="list"
            header={
                <Header
                    elementRef={element => model.setStickyHeader(element)}
                    initialIndex={Math.round(pseudoRandomSizes.length / 2)}
                    maxIndex={pseudoRandomSizes.length - 1}
                    onScroll={index =>
                        model.scrollToIndex(index, { behavior: "smooth" })
                    }
                />
            }
            footer={
                <Footer
                    elementRef={element => model.setStickyFooter(element)}
                    minRowsToAdd={1 - pseudoRandomSizes.length}
                    maxRowsToAdd={MAX_ROW_COUNT - pseudoRandomSizes.length}
                    onChangeRows={changeRowCount}
                />
            }
        >
            {Item}
        </VirtualList>
    );
};

export default ScrollToItem;
