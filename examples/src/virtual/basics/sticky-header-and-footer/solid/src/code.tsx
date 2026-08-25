import {
    createVirtual,
    createVirtualItemRef,
    VirtualList,
    type ListItemProps
} from "@af-utils/virtual-solid";
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

const StickyHeaderAndFooter = () => {
    const rows = createVirtual({ itemCount: 200_000 });
    return (
        <VirtualList
            model={rows}
            role="list"
            aria-label="Sticky header and footer list"
            header={
                <div
                    ref={element => rows.setStickyHeader(element)}
                    class={css.header}
                    data-testid="sticky-header"
                >
                    Header
                </div>
            }
            footer={
                <div
                    ref={element => rows.setStickyFooter(element)}
                    class={css.footer}
                    data-testid="sticky-footer"
                >
                    Footer
                </div>
            }
        >
            {Item}
        </VirtualList>
    );
};

export default StickyHeaderAndFooter;
