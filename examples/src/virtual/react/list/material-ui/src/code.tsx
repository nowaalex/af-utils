import { memo } from "react";
import { useVirtual, List, useVirtualItemRef } from "@af-utils/virtual-react";
import MuiListNative from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import type { ListItemProps } from "@af-utils/virtual-react";

const Item = memo<ListItemProps>(({ model, index }) => (
    <ListItem ref={useVirtualItemRef(model, index)} disablePadding>
        <ListItemButton>
            <ListItemText primary={`row ${index}`} />
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
