import type { ListItemProps } from "@af-utils/virtual-react";
import {
    VirtualList,
    useVirtual,
    useVirtualItemRef
} from "@af-utils/virtual-react";
import MuiListNative from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { memo } from "react";

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
        <VirtualList component={MuiListNative} disablePadding model={rows}>
            {Item}
        </VirtualList>
    );
};

export default MuiList;
