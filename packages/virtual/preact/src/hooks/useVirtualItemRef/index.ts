import type { VirtualScroller } from "@af-utils/virtual-core";
import type { RefCallback } from "preact";
import { useCallback } from "preact/hooks";

/** Observe one rendered item using a stable Preact callback ref. @public */
export const useVirtualItemRef = (
    model: VirtualScroller,
    index: number
): RefCallback<HTMLElement> =>
    useCallback(
        element => {
            if (!element) return;
            model.attachItem(element, index);
            return () => model.detachItem(element);
        },
        [model, index]
    );

/** Observe row and column sizes for one rendered grid cell. @public */
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
