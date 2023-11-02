"use client";

import { memo, lazy, Suspense } from "react";
import { useVirtual, List, ListItemProps } from "@af-utils/virtual-react";

/*
Website does not use MUI, so importing dynamically for code splitting.
Suspense component is located upper, so ignoring it here
*/
const MuiListNative = lazy(() => import("@mui/material/List"));
const ListItem = lazy(() => import("@mui/material/ListItem"));
const ListItemButton = lazy(() => import("@mui/material/ListItemButton"));
const ListItemText = lazy(() => import("@mui/material/ListItemText"));

const Item = memo<ListItemProps>(({ i, model }) => (
    <ListItem ref={el => model.el(i, el)} disablePadding>
        <ListItemButton>
            <ListItemText primary={`row ${i}`} />
        </ListItemButton>
    </ListItem>
));

const MuiList = () => {
    const rows = useVirtual({
        itemCount: 50000,
        estimatedItemSize: 48
    });

    return (
        <Suspense fallback="Loading MUI...">
            <List component={MuiListNative} disablePadding model={rows}>
                {Item}
            </List>
        </Suspense>
    );
};

export default MuiList;
