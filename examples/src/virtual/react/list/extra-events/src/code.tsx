import { memo } from "react";
import {
    useVirtual,
    List,
    Subscription,
    createListItemRef
} from "@af-utils/virtual-react";
import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import type { ListItemProps } from "@af-utils/virtual-react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ model, i }) => (
    <div ref={createListItemRef(model, i)} className={css.item}>
        row {i}
    </div>
));

const ExtraEvents = () => {
    const rows = useVirtual({
        itemCount: 150000,
        estimatedItemSize: 45
    });

    return (
        <List
            model={rows}
            header={
                <div
                    className={`${css.row} ${css.top0}`}
                    ref={el => rows.setStickyHeader(el)}
                >
                    <Subscription
                        model={rows}
                        events={[VirtualScrollerEvent.RANGE]}
                    >
                        {() => (
                            <>
                                Rendered {rows.to - rows.from} items. Range:{" "}
                                {rows.from} - {rows.to}
                            </>
                        )}
                    </Subscription>
                </div>
            }
            footer={
                <div
                    className={`${css.row} ${css.bottom0}`}
                    ref={el => rows.setStickyFooter(el)}
                >
                    Scroll size:{" "}
                    <Subscription
                        model={rows}
                        events={[VirtualScrollerEvent.SCROLL_SIZE]}
                    >
                        {() => rows.scrollSize}
                    </Subscription>
                    px
                </div>
            }
        >
            {Item}
        </List>
    );
};

export default ExtraEvents;
