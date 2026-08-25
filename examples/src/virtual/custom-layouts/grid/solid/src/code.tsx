import {
    mapVirtualRangeWithOffset,
    type VirtualScroller,
    VirtualScrollerEvent
} from "@af-utils/virtual-core";
import {
    createVirtual,
    createVirtualGridItemRef,
    createVirtualSnapshot
} from "@af-utils/virtual-solid";
import { createMemo, Index } from "solid-js";
import css from "./style.module.css";

const SIZE = 50_000;

const scrollModelTo = (model: VirtualScroller, value: string) => {
    const index = Number.parseInt(value, 10);
    if (!Number.isNaN(index)) {
        model.scrollToIndex(index, { behavior: "smooth" });
    }
};

const Grid = () => {
    const rows = createVirtual({
        itemCount: SIZE,
        estimatedItemSize: 120,
        overscanCount: 2
    });
    const columns = createVirtual({
        itemCount: SIZE,
        estimatedItemSize: 200,
        overscanCount: 2,
        horizontal: true
    });
    const rowRevision = createVirtualSnapshot(rows, VirtualScrollerEvent.ALL);
    const columnRevision = createVirtualSnapshot(
        columns,
        VirtualScrollerEvent.ALL
    );
    const cells = createMemo(() => {
        rowRevision();
        columnRevision();
        return mapVirtualRangeWithOffset(rows, (row, rowOffset) =>
            mapVirtualRangeWithOffset(columns, (column, columnOffset) => ({
                column,
                columnOffset,
                row,
                rowOffset
            }))
        ).flat();
    });

    return (
        <div class={css.root}>
            <form
                class={css.form}
                onSubmit={event => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    scrollModelTo(
                        form.get("type") === "row" ? rows : columns,
                        String(form.get("index") ?? "")
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
                    class="w-28"
                />
                <button type="submit" class={css.btn}>
                    Scroll
                </button>
            </form>
            <div
                class={css.grid}
                data-testid="virtual-grid"
                ref={element => {
                    rows.setScroller(element);
                    columns.setScroller(element);
                }}
            >
                <div
                    class={css.gridItems}
                    style={{
                        height: `${rows.scrollSize}px`,
                        width: `${columns.scrollSize}px`
                    }}
                >
                    <Index each={cells()}>
                        {cell => {
                            const row = createMemo(() => cell().row);
                            const column = createMemo(() => cell().column);

                            return (
                                <div
                                    ref={createVirtualGridItemRef(
                                        rows,
                                        row,
                                        columns,
                                        column
                                    )}
                                    class={css.cell}
                                    data-row-index={row()}
                                    data-column-index={column()}
                                    style={{
                                        width: `${Math.max(
                                            column() ** 2 % 256,
                                            190
                                        )}px`,
                                        padding: `${Math.max(
                                            row() ** 2 % 64,
                                            30
                                        )}px 0`,
                                        transform: `translateX(${cell().columnOffset}px) translateY(${cell().rowOffset}px)`
                                    }}
                                >
                                    <div class={css.cellContent}>
                                        <span>row:</span>
                                        {row()}
                                        <span>col:</span>
                                        {column()}
                                    </div>
                                </div>
                            );
                        }}
                    </Index>
                </div>
            </div>
        </div>
    );
};

export default Grid;
