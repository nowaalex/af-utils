import type { VirtualScroller } from "@af-utils/virtual-core";
import { createRenderEffect, onCleanup } from "solid-js";
import type { MaybeAccessor, VirtualElementRef } from "../../types";
import readAccessor from "../../utils/readAccessor";

/**
 * Create a Solid ref that observes one rendered virtual item.
 *
 * @public
 */
export const createVirtualItemRef =
    (model: VirtualScroller, index: MaybeAccessor<number>): VirtualElementRef =>
    element => {
        createRenderEffect(() => {
            model.attachItem(element, readAccessor(index));
            onCleanup(() => model.detachItem(element));
        });
    };

/**
 * Create a Solid ref that observes row and column sizes for one grid cell.
 *
 * @public
 */
export const createVirtualGridItemRef =
    (
        rows: VirtualScroller,
        rowIndex: MaybeAccessor<number>,
        columns: VirtualScroller,
        columnIndex: MaybeAccessor<number>
    ): VirtualElementRef =>
    element => {
        createRenderEffect(() => {
            const currentRowIndex = readAccessor(rowIndex);
            const currentColumnIndex = readAccessor(columnIndex);
            let attached = 0;

            if (rows.from === currentRowIndex) {
                columns.attachItem(element, currentColumnIndex);
                attached |= 1;
            }
            if (columns.from === currentColumnIndex) {
                rows.attachItem(element, currentRowIndex);
                attached |= 2;
            }

            onCleanup(() => {
                if (attached & 1) columns.detachItem(element);
                if (attached & 2) rows.detachItem(element);
            });
        });
    };
