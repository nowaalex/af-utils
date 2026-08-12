import {
    type VirtualScroller,
    VirtualScrollerEvent
} from "@af-utils/virtual-core";
import type { ListItemProps } from "@af-utils/virtual-react";
import {
    List,
    useVirtual,
    useVirtualItemRef,
    useVirtualSnapshot
} from "@af-utils/virtual-react";
import { memo } from "react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ model, index }) => (
    <div
        ref={useVirtualItemRef(model, index)}
        className={css.item}
        role="listitem"
        aria-posinset={index + 1}
        aria-setsize={model.itemCount}
    >
        row {index}
    </div>
));

const RangeInfo = ({ model }: { model: VirtualScroller }) => {
    useVirtualSnapshot(model, VirtualScrollerEvent.RANGE);
    return `Rendered ${model.to - model.from} items. Range: ${model.from} - ${model.to}`;
};

const ScrollSize = ({ model }: { model: VirtualScroller }) => {
    useVirtualSnapshot(model, VirtualScrollerEvent.SCROLL_SIZE);
    return model.scrollSize;
};

const ExtraEvents = () => {
    const rows = useVirtual({
        itemCount: 150000,
        estimatedItemSize: 45
    });

    return (
        <List
            model={rows}
            role="list"
            aria-label="Extra events list"
            header={
                <div
                    className={`${css.row} ${css.top0}`}
                    ref={el => rows.setStickyHeader(el)}
                >
                    <RangeInfo model={rows} />
                </div>
            }
            footer={
                <div
                    className={`${css.row} ${css.bottom0}`}
                    ref={el => rows.setStickyFooter(el)}
                >
                    Scroll size: <ScrollSize model={rows} />
                    px
                </div>
            }
        >
            {Item}
        </List>
    );
};

export default ExtraEvents;
