"use client";

import { memo, lazy, Suspense } from "react";
import { useVirtual, List, ListItemProps } from "@af-utils/virtual-react";

/*
Normally full style should be used.
Truncating it manually, because only List is used
*/
import "./truncated-bootstrap-style.css";

/*
Website does not use bootstrap, so importing dynamically for code splitting.
Suspense component is located upper, so ignoring it here
*/
const BootstrapListGroup = lazy(() => import("react-bootstrap/ListGroup"));
const BootstrapListItem = lazy(() => import("react-bootstrap/ListGroupItem"));

const Item = memo<ListItemProps>(({ i, model }) => (
    <BootstrapListItem
        ref={(el: HTMLElement) => model.el(i, el)}
        className="!border-l-0 first:border-t-0 last:border-b-0"
    >
        row {i}
    </BootstrapListItem>
));

const BootstrapList = () => {
    const rows = useVirtual({
        itemCount: 50000,
        estimatedItemSize: 45
    });

    return (
        <Suspense fallback="Loading bootstrap...">
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
        </Suspense>
    );
};

export default BootstrapList;
