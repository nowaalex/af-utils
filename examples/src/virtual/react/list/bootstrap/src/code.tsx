import { memo } from "react";
import { useVirtual, List, useVirtualItemRef } from "@af-utils/virtual-react";
import BootstrapListGroup from "react-bootstrap/ListGroup";
import BootstrapListItem from "react-bootstrap/ListGroupItem";
import type { ListItemProps } from "@af-utils/virtual-react";

/*
Normally full style should be used.
Truncating it manually, because only List is used
*/
import "./truncated-bootstrap-style.css";

const Item = memo<ListItemProps>(({ model, index }) => (
    <BootstrapListItem
        ref={useVirtualItemRef(model, index)}
        style={{ borderLeft: 0 }}
    >
        row {index}
    </BootstrapListItem>
));

const BootstrapList = () => {
    const rows = useVirtual({
        itemCount: 50000,
        estimatedItemSize: 45
    });

    return (
        <List
            component={BootstrapListGroup}
            className="border"
            variant="flush"
            style={{
                // overriding default flex column for vertical list
                display: "block"
            }}
            model={rows}
        >
            {Item}
        </List>
    );
};

export default BootstrapList;
