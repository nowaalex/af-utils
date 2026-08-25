import {
    createVirtual,
    createVirtualItemRef,
    VirtualList,
    type ListItemProps
} from "@af-utils/virtual-solid";

const Item = (props: ListItemProps) => (
    <div
        ref={createVirtualItemRef(props.model, props.index)}
        role="listitem"
        aria-posinset={props.index() + 1}
        aria-setsize={props.model.itemCount}
        style={{ "border-top": "2px solid #ccc", padding: "0.6em" }}
    >
        row {props.index()}
    </div>
);

const SimpleList = () => {
    const rows = createVirtual({ itemCount: 150_000 });

    return (
        <VirtualList model={rows} role="list" aria-label="Simple virtual list">
            {Item}
        </VirtualList>
    );
};

export default SimpleList;
