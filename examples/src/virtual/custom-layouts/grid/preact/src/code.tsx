import {
    mapVirtualRangeWithOffset,
    type VirtualScroller,
    VirtualScrollerEvent
} from "@af-utils/virtual-core";

import {
    useVirtual,
    useVirtualGridItemRef,
    useVirtualSnapshot
} from "@af-utils/virtual-preact";
import { Fragment, memo } from "preact/compat";

import css from "./style.module.css";

const events = VirtualScrollerEvent.ALL;

const Cell = memo<{
    rows: VirtualScroller;
    cols: VirtualScroller;
    rowI: number;
    colI: number;
    rowOffset: number;
    colOffset: number;
}>(({ rows, cols, rowI, colI, rowOffset, colOffset }) => (
    <div
        ref={useVirtualGridItemRef(rows, rowI, cols, colI)}
        className={css.cell}
        data-row-index={rowI}
        data-column-index={colI}
        style={{
            width: Math.max(colI ** 2 % 256, 190),
            padding: `${Math.max(rowI ** 2 % 64, 30)}px 0`,
            transform: `translateX(${colOffset}px) translateY(${rowOffset}px)`
        }}
    >
        <div className={css.cellContent}>
            <span>row:</span>
            {rowI}
            <span>col:</span>
            {colI}
        </div>
    </div>
));

const GridItems = ({
    rows,
    cols
}: {
    rows: VirtualScroller;
    cols: VirtualScroller;
}) => {
    useVirtualSnapshot(rows, events);
    useVirtualSnapshot(cols, events);

    return (
        <div
            className={css.gridItems}
            style={{
                height: rows.scrollSize,
                width: cols.scrollSize
            }}
        >
            {mapVirtualRangeWithOffset(rows, (rowI, rowOffset) => (
                <Fragment key={rowI}>
                    {mapVirtualRangeWithOffset(cols, (colI, colOffset) => (
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
            model.scrollToIndex(idx, { behavior: "smooth" });
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
        <div className={css.root}>
            <form
                className={css.form}
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
                    max={SIZE - 1}
                    className="w-28"
                />
                <button type="submit" className={css.btn}>
                    Scroll
                </button>
            </form>
            <div
                className={css.grid}
                data-testid="virtual-grid"
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
