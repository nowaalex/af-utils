import {
    createVirtual,
    createVirtualItemRef,
    VirtualList,
    type ListItemProps
} from "@af-utils/virtual-solid";
import { createEffect, createSignal } from "solid-js";
import Footer from "./Footer";
import Header from "./Header";
import css from "./style.module.css";

const DEFAULT_ROW_COUNT = 50_000;
const MAX_ROW_COUNT = 100_000;

const Item = (props: ListItemProps<number[]>) => (
    <div
        ref={createVirtualItemRef(props.model, props.index)}
        class={css.item}
        role="listitem"
        aria-posinset={props.index() + 1}
        aria-setsize={props.data?.length}
        style={{ padding: `${props.data?.[props.index()]}px 0.7em` }}
    >
        row {props.index()}:&nbsp;{props.data?.[props.index()]}px
    </div>
);

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

    const changeRows = (rowsToAdd: number) => {
        if (rowsToAdd !== 0) {
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
        <VirtualList
            class={css.list}
            model={model}
            itemData={sizes()}
            role="list"
            header={
                <Header
                    elementRef={element => model.setStickyHeader(element)}
                    initialIndex={Math.round(sizes().length / 2)}
                    maxIndex={sizes().length - 1}
                    onScroll={index =>
                        model.scrollToIndex(index, { behavior: "smooth" })
                    }
                />
            }
            footer={
                <Footer
                    elementRef={element => model.setStickyFooter(element)}
                    minRowsToAdd={1 - sizes().length}
                    maxRowsToAdd={MAX_ROW_COUNT - sizes().length}
                    onChangeRows={changeRows}
                />
            }
        >
            {Item}
        </VirtualList>
    );
};

export default ScrollToItem;
