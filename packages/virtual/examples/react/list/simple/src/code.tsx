import { memo } from "react";
import { useVirtual, List, ListItemProps } from "@af-utils/virtual-react";

const Item = memo<ListItemProps>(({ i, model }) => (
    <div
        ref={el => model.el(i, el)}
        style={{ border: "1px solid #ccc", padding: "0.5em" }}
    >
        row {i}
    </div>
));

const SimpleList = () => {
    const rows = useVirtual({
        itemCount: 150000
    });

    return (
        <List model={rows} style={{ border: "1px solid #ccc" }}>
            {Item}
        </List>
    );
};

export default SimpleList;
