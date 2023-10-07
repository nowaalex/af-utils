"use client";

import { memo } from "react";
import MuiList from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useVirtual, List } from "@af-utils/virtual-react";
import type { ListItemProps } from "@af-utils/virtual-react/lib/types";

const Item = memo<ListItemProps>(({ i, model }) => (
    <ListItem ref={el => model.el(i, el)} disablePadding>
        <ListItemButton>
            <ListItemText primary={`row ${i}`} />
        </ListItemButton>
    </ListItem>
));

const SimpleList = () => {
    const rows = useVirtual({
        itemCount: 50000
    });

    /*
        If you place List inside block container,
        you must specify height: 100% by adding style/className.
    */
    return (
        <List component={MuiList} disablePadding model={rows}>
            {Item}
        </List>
    );
};

export default SimpleList;
