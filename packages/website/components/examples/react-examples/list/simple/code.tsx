"use client";

import { memo } from "react";
import { useVirtual, List, ListItemProps } from "@af-utils/virtual-react";

const Item = memo<ListItemProps>(({ i, model }) => (
    <div
        ref={el => model.el(i, el)}
        className="border-b p-2 border-zinc-400 last:border-none"
    >
        row {i}
    </div>
));

const SimpleList = () => {
    const rows = useVirtual({
        itemCount: 150000
    });

    return (
        <List model={rows} className="border border-zinc-300">
            {Item}
        </List>
    );
};

export default SimpleList;
