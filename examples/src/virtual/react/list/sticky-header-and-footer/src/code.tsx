import { memo } from "react";
import { useVirtual, List, useVirtualItemRef } from "@af-utils/virtual-react";
import type { ListItemProps } from "@af-utils/virtual-react";
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

const StickyHeaderAndFooter = () => {
    const rows = useVirtual({
        itemCount: 200000
    });

    return (
        <List
            model={rows}
            role="list"
            aria-label="Sticky header and footer list"
            header={
                <div
                    ref={el => rows.setStickyHeader(el)}
                    className={css.header}
                    data-testid="sticky-header"
                >
                    Header
                </div>
            }
            footer={
                <div
                    ref={el => rows.setStickyFooter(el)}
                    className={css.footer}
                    data-testid="sticky-footer"
                >
                    Footer
                </div>
            }
        >
            {Item}
        </List>
    );
};

export default StickyHeaderAndFooter;
