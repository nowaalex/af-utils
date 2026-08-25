import {
    type VirtualScroller,
    VirtualScrollerEvent
} from "@af-utils/virtual-core";
import {
    createVirtual,
    createVirtualItemRef,
    createVirtualSnapshot,
    VirtualList,
    type ListItemProps
} from "@af-utils/virtual-solid";
import { createMemo } from "solid-js";
import css from "./style.module.css";

const Item = (props: ListItemProps) => (
    <div
        ref={createVirtualItemRef(props.model, props.index)}
        class={css.item}
        role="listitem"
        aria-posinset={props.index() + 1}
        aria-setsize={props.model.itemCount}
    >
        row {props.index()}
    </div>
);

const RangeInfo = (props: { model: VirtualScroller }) => {
    const revision = createVirtualSnapshot(
        props.model,
        VirtualScrollerEvent.RANGE
    );
    const rangeInfo = createMemo(() => {
        revision();
        return `Rendered ${props.model.to - props.model.from} items. Range: ${props.model.from} - ${props.model.to}`;
    });

    return <>{rangeInfo()}</>;
};

const ScrollSize = (props: { model: VirtualScroller }) => {
    const revision = createVirtualSnapshot(
        props.model,
        VirtualScrollerEvent.SCROLL_SIZE
    );
    const scrollSize = createMemo(() => {
        revision();
        return props.model.scrollSize;
    });

    return <>{scrollSize()}</>;
};

const EventSubscriptions = () => {
    const rows = createVirtual({
        itemCount: 150_000,
        estimatedItemSize: 35
    });

    return (
        <VirtualList
            model={rows}
            role="list"
            aria-label="Extra events list"
            header={
                <div
                    class={`${css.row} ${css.top0}`}
                    ref={element => rows.setStickyHeader(element)}
                >
                    <RangeInfo model={rows} />
                </div>
            }
            footer={
                <div
                    class={`${css.row} ${css.bottom0}`}
                    ref={element => rows.setStickyFooter(element)}
                >
                    Scroll size: <ScrollSize model={rows} />
                    px
                </div>
            }
        >
            {Item}
        </VirtualList>
    );
};

export default EventSubscriptions;
