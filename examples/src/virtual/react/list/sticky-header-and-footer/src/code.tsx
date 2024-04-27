import { memo } from "react";
import { useVirtual, List, createListItemRef } from "@af-utils/virtual-react";
import type { ListItemProps } from "@af-utils/virtual-react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ model, i }) => (
    <div ref={createListItemRef(model, i)} className={css.item}>
        row {i}
    </div>
));

const StickyHeaderAndFooter = () => {
    const rows = useVirtual({
        itemCount: 200000
    });

    return (
        <List
            model={rows}
            header={
                <div
                    ref={el => rows.setStickyHeader(el)}
                    className={css.header}
                >
                    Header
                </div>
            }
            footer={
                <div
                    ref={el => rows.setStickyFooter(el)}
                    className={css.footer}
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
