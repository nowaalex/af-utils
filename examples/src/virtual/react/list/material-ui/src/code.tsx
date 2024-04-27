import { memo } from "react";
import { useVirtual, List, createListItemRef } from "@af-utils/virtual-react";
import MuiListNative from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import type { ListItemProps } from "@af-utils/virtual-react";

const Item = memo<ListItemProps>(({ model, i }) => (
    <ListItem ref={createListItemRef(model, i)} disablePadding>
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
        <List component={MuiListNative} disablePadding model={rows}>
            {Item}
        </List>
    );
};

export default MuiList;
