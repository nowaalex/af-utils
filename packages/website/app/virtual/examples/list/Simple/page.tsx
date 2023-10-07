"use client";

import { memo } from "react";
import { useVirtual, List } from "@af-utils/virtual-react";
import type { ListItemProps } from "@af-utils/virtual-react/lib/types";

const Item = memo<ListItemProps>(({ i, model }) => (
    <div ref={el => model.el(i, el)} className="border-t p-2 border-zinc-400">
        row {i}
    </div>
));

const SimpleList = () => {
    const rows = useVirtual({
        itemCount: 250000
    });

    return <List model={rows}>{Item}</List>;
};

export default SimpleList;
