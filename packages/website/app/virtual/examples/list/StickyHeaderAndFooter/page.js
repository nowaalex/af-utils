"use client";

import { memo } from "react";
import { useVirtual, List } from "@af-utils/react-virtual-list";

const Item = memo(({ i, model }) => (
    <div ref={el => model.el(i, el)} className="border-t p-2 border-zinc-400">
        row {i}
    </div>
));

const StickyHeaderAndFooter = () => {
    const rows = useVirtual({
        itemCount: 200000
    });

    return (
        <List
            className="h-full"
            model={rows}
            header={
                <div
                    ref={el => rows.setStickyHeader(el)}
                    className="sticky top-0 p-4 bg-green-300"
                >
                    Header
                </div>
            }
            footer={
                <div
                    ref={el => rows.setStickyFooter(el)}
                    className="sticky bottom-0 p-8 bg-orange-300"
                >
                    Footer
                </div>
            }
        >
            {Item}
        </List>
    );
};

export default StickyHeaderAndFooter;
