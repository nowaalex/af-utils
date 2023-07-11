"use client";

import { memo } from "react";
import { useVirtual, List } from "@af-utils/react-virtual-list";

const Item = memo(({ i, model }) => (
    <div ref={el => model.el(i, el)} className="border-t p-2 border-zinc-400">
        row {i}
    </div>
));

const SimpleList = () => {
    const rows = useVirtual({
        itemCount: 250000
    });

    return (
        <List className="h-full" model={rows}>
            {Item}
        </List>
    );
};

export default SimpleList;
