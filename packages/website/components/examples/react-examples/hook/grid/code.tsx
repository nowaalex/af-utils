"use client";

import { Fragment, memo, useRef } from "react";

import {
    useVirtual,
    useComponentSubscription,
    mapVisibleRangeWithOffset
} from "@af-utils/virtual-react";

import { VirtualScroller, VirtualScrollerEvent } from "@af-utils/virtual-core";

const events = [
    VirtualScrollerEvent.RANGE,
    VirtualScrollerEvent.SCROLL_SIZE,
    VirtualScrollerEvent.SIZES
] as const;

const Cell = memo<{
    rows: VirtualScroller;
    cols: VirtualScroller;
    rowI: number;
    colI: number;
    rowOffset: number;
    colOffset: number;
}>(({ rows, cols, rowI, colI, rowOffset, colOffset }) => {
    // caching for proper unmount in ref
    const [colFrom, rowFrom] = useRef([cols.from, rows.from]).current;

    return (
        <div
            ref={el => {
                if (colI === colFrom) {
                    rows.el(rowI, el);
                }
                if (rowI === rowFrom) {
                    cols.el(colI, el);
                }
            }}
            className="absolute border top-0 left-0 text-center"
            style={{
                width: Math.max(colI ** 2 % 256, 190),
                padding: `${Math.max(rowI ** 2 % 64, 30)}px 0`,
                transform: `translateX(${colOffset}px) translateY(${rowOffset}px)`
            }}
        >
            <div className="inline-grid grid-cols-2 gap-x-2 place-items-start">
                <span>row:</span>
                {rowI}
                <span>col:</span>
                {colI}
            </div>
        </div>
    );
});

const GridItems = ({
    rows,
    cols
}: {
    rows: VirtualScroller;
    cols: VirtualScroller;
}) => {
    useComponentSubscription(rows, events);
    useComponentSubscription(cols, events);

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
                            rows={rows}
                            cols={cols}
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

const SIZE = 50000;

const scrollModelTo = (model: VirtualScroller, value: string | undefined) => {
    if (value !== undefined) {
        const idx = Number.parseInt(value, 10);

        if (!Number.isNaN(idx)) {
            model.scrollToIndex(idx, true);
        }
    }
};

const GridHook = () => {
    const rows = useVirtual({
        itemCount: SIZE,
        estimatedItemSize: 120,
        overscanCount: 2
    });

    const cols = useVirtual({
        itemCount: SIZE,
        estimatedItemSize: 200,
        overscanCount: 2,
        horizontal: true
    });

    return (
        <div className="flex flex-col">
            <form
                className="flex-none flex flex-wrap gap-2 p-2 bg-orange-200"
                onSubmit={e => {
                    e.preventDefault();
                    scrollModelTo(
                        e.currentTarget.type.value === "row" ? rows : cols,
                        e.currentTarget.index.value
                    );
                }}
            >
                <select name="type">
                    <option value="row">Row</option>
                    <option value="col">Col</option>
                </select>
                <input
                    placeholder="index"
                    type="number"
                    name="index"
                    min={0}
                    max={SIZE}
                    className="w-28"
                />
                <button
                    type="submit"
                    className="px-4 border border-gray-500 bg-white hover:bg-gray-200"
                >
                    Scroll
                </button>
            </form>
            <div
                className="overflow-auto contain-strict flex-grow"
                ref={el => {
                    rows.setScroller(el);
                    cols.setScroller(el);
                }}
            >
                <GridItems rows={rows} cols={cols} />
            </div>
        </div>
    );
};

export default GridHook;
