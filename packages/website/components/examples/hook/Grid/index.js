import { Fragment, memo } from "react";

import {
    useVirtual,
    mapVisibleRange,
    useComponentSubscription
} from "@af-utils/react-virtual-headless";

const Cell = memo(({ rowI, colI, rowOffset, colOffset }) => (
    <div
        className="absolute border top-0 left-0 leading-[100px] w-[200px] text-center"
        style={{
            transform: `translateX(${colOffset}px) translateY(${rowOffset}px)`
        }}
    >
        cell {rowI} * {colI}
    </div>
));

const GridItems = ({ rows, cols }) => {
    useComponentSubscription(rows);
    useComponentSubscription(cols);

    return (
        <div
            className="relative overflow-hidden"
            style={{
                height: rows.scrollSize,
                width: cols.scrollSize
            }}
        >
            {mapVisibleRange(
                rows,
                (rowI, rowOffset) => (
                    <Fragment key={rowI}>
                        {mapVisibleRange(
                            cols,
                            (colI, colOffset) => (
                                <Cell
                                    key={colI}
                                    rowOffset={rowOffset}
                                    colOffset={colOffset}
                                    rowI={rowI}
                                    colI={colI}
                                />
                            ),
                            true
                        )}
                    </Fragment>
                ),
                true
            )}
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
            className="overflow-auto h-full"
            ref={el => {
                rows.setScrollElement(el);
                cols.setScrollElement(el);
            }}
        >
            <GridItems rows={rows} cols={cols} />
        </div>
    );
};

export default SimpleHook;
