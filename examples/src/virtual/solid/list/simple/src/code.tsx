import {
    createVirtual,
    createVirtualItemRef,
    List,
    type ListItemProps
} from "@af-utils/virtual-solid";

const Item = (props: ListItemProps) => (
    <div
        ref={createVirtualItemRef(props.model, props.index)}
        role="listitem"
        aria-posinset={props.index + 1}
        aria-setsize={props.model.itemCount}
        style={{ "border-top": "2px solid #ccc", padding: "0.6em" }}
    >
        row {props.index}
    </div>
);

const SimpleList = () => {
    const rows = createVirtual({ itemCount: 150_000 });

    return (
        <List model={rows} role="list" aria-label="Solid virtual list">
            {Item}
        </List>
    );
};

export default SimpleList;
