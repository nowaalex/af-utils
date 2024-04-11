import { memo } from "react";
import { useVirtual, List } from "@af-utils/virtual-react";
import type { ListItemProps } from "@af-utils/virtual-react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ i, model }) => (
    <div ref={el => model.el(i, el)} className={css.item}>
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
