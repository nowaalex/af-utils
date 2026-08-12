import type { VirtualScroller } from "@af-utils/virtual-core";
import { type RefCallback, useCallback } from "react";

/** @public Observe one rendered item using a stable React callback ref. */
export const useVirtualItemRef = (
    model: VirtualScroller,
    index: number
): RefCallback<HTMLElement> =>
    useCallback(
        element => {
            if (element) {
                model.attachItem(element, index);
                return () => model.detachItem(element);
            }
        },
        [model, index]
    );

/** @public Observe row and column sizes for one rendered grid cell. */
export const useVirtualGridItemRef = (
    rows: VirtualScroller,
    rowIndex: number,
    columns: VirtualScroller,
    columnIndex: number
): RefCallback<HTMLElement> =>
    useCallback(
        element => {
            if (!element) return;

            let attached = 0;
            if (rows.from === rowIndex) {
                columns.attachItem(element, columnIndex);
                attached |= 1;
            }
            if (columns.from === columnIndex) {
                rows.attachItem(element, rowIndex);
                attached |= 2;
            }

            return () => {
                if (attached & 1) columns.detachItem(element);
                if (attached & 2) rows.detachItem(element);
            };
        },
        [rows, rowIndex, columns, columnIndex]
    );
