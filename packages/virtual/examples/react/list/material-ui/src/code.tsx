import { memo } from "react";
import { useVirtual, List, ListItemProps } from "@af-utils/virtual-react";

import MuiListNative from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";

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
        <List component={MuiListNative} disablePadding model={rows}>
            {Item}
        </List>
    );
};

export default MuiList;
