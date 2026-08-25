import type { VirtualScroller } from "@af-utils/virtual-core";
import { createRenderEffect, onCleanup } from "solid-js";
import type { MaybeAccessor } from "../../types";
import readAccessor from "../../utils/readAccessor";

/**
 * Create a Solid ref that observes one rendered virtual item.
 *
 * @public
 */
export const createVirtualItemRef =
    (
        model: VirtualScroller,
        index: MaybeAccessor<number>
    ): ((element: HTMLElement) => void) =>
    element => {
        if (typeof index !== "function") {
            model.attachItem(element, index);
            onCleanup(() => model.detachItem(element));
            return;
        }

        createRenderEffect(() => {
            model.attachItem(element, index());
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
    ): ((element: HTMLElement) => void) =>
    element => {
        const attach = (
            currentRowIndex: number,
            currentColumnIndex: number
        ) => {
            let attached = 0;

            if (rows.from === currentRowIndex) {
                columns.attachItem(element, currentColumnIndex);
                attached |= 1;
            }
            if (columns.from === currentColumnIndex) {
                rows.attachItem(element, currentRowIndex);
                attached |= 2;
            }

            return () => {
                if (attached & 1) columns.detachItem(element);
                if (attached & 2) rows.detachItem(element);
            };
        };

        if (
            typeof rowIndex !== "function" &&
            typeof columnIndex !== "function"
        ) {
            onCleanup(attach(rowIndex, columnIndex));
            return;
        }

        createRenderEffect(() => {
            const currentRowIndex = readAccessor(rowIndex);
            const currentColumnIndex = readAccessor(columnIndex);
            onCleanup(attach(currentRowIndex, currentColumnIndex));
        });
    };
