"use client";

import { memo } from "react";
import { useVirtual, List, ListItemProps } from "@af-utils/virtual-react";

const Item = memo<ListItemProps>(({ i, model }) => (
    <div
        ref={el => model.el(i, el)}
        className={"p-8" + (i % 2 ? "" : " bg-orange-100")}
    >
        col&nbsp;{i}
    </div>
));

const HorizontalList = () => {
    const cols = useVirtual({
        itemCount: 50000,
        estimatedItemSize: 75,
        horizontal: true
    });

    return (
        <List model={cols} className="border border-slate-400">
            {Item}
        </List>
    );
};

export default HorizontalList;
