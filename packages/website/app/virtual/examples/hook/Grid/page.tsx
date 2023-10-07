"use client";

import { Fragment, memo } from "react";

import {
    useVirtual,
    useComponentSubscription,
    mapVisibleRangeWithOffset
} from "@af-utils/virtual-react";

import type { VirtualScroller } from "@af-utils/virtual-core";

const Cell = memo<{
    rowI: number;
    colI: number;
    rowOffset: number;
    colOffset: number;
}>(({ rowI, colI, rowOffset, colOffset }) => (
    <div
        className="absolute border top-0 left-0 leading-[100px] w-[200px] text-center"
        style={{
            transform: `translateX(${colOffset}px) translateY(${rowOffset}px)`
        }}
    >
        cell {rowI} * {colI}
    </div>
));

const GridItems = ({
    rows,
    cols
}: {
    rows: VirtualScroller;
    cols: VirtualScroller;
}) => {
    useComponentSubscription(rows);
    useComponentSubscription(cols);

    return (
        <div
            className="relative overflow-hidden contain-strict"
            style={{
                height: rows.scrollSize,
                width: cols.scrollSize
            }}
        >
            {mapVisibleRangeWithOffset(rows, (rowI, rowOffset) => (
                <Fragment key={rowI}>
                    {mapVisibleRangeWithOffset(cols, (colI, colOffset) => (
                        <Cell
                            key={colI}
                            rowOffset={rowOffset}
                            colOffset={colOffset}
                            rowI={rowI}
                            colI={colI}
                        />
                    ))}
                </Fragment>
            ))}
        </div>
    );
};

const SimpleHook = () => {
    const rows = useVirtual({
        itemCount: 50000,
        estimatedItemSize: 102
    });

    const cols = useVirtual({
        itemCount: 50000,
        estimatedItemSize: 200,
        horizontal: true
    });

    return (
        <div
            className="overflow-auto contain-strict"
            ref={el => {
                rows.setScroller(el);
                cols.setScroller(el);
            }}
        >
            <GridItems rows={rows} cols={cols} />
        </div>
    );
};

export default SimpleHook;
