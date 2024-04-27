import type { VirtualScroller } from "@af-utils/virtual-core";
/**
 * @public
 * Creates callback ref for list item at specified index.
 * @param model - {@link @af-utils/virtual-core#VirtualScroller} instance
 * @param itemIndex - item index
 *
 * @remarks
 * Calls {@link @af-utils/virtual-core#VirtualScroller.attachItem} when item is mounted and
 * {@link @af-utils/virtual-core#VirtualScroller.detachItem} when item is about to unmount.
 *
 * @returns callback ref
 */
export const createListItemRef = (
    model: VirtualScroller,
    itemIndex: number
) => {
    let cachedEl: HTMLElement | null = null;

    return (el: HTMLElement | null) => {
        if (el) {
            cachedEl = el;
            model.attachItem(el, itemIndex);
        } else if (cachedEl) {
            model.detachItem(cachedEl);
            cachedEl = null;
        }
    };
};

/**
 * @public
 * Creates callback ref for grid item at specified index.
 * @param model - {@link @af-utils/virtual-core#VirtualScroller} instance
 * @param rowItemIndex - row item index
 * @param colItemIndex - column item index
 *
 * @remarks
 * Calls {@link @af-utils/virtual-core#VirtualScroller.attachItem} when item is mounted and
 * {@link @af-utils/virtual-core#VirtualScroller.detachItem} when item is about to unmount.
 *
 * {@link createListItemRef} differences:
 *
 * - works with two models at the same time;
 *
 * - column widths are taken only from first mounted row;
 *
 * - row heights are taken only from first mounted column.
 *
 * @returns callback ref
 */
export const createGridItemRef = (
    rowsModel: VirtualScroller,
    rowItemIndex: number,
    colsModel: VirtualScroller,
    colItemIndex: number
) => {
    let mask = 0;
    let cachedEl: HTMLElement | null = null;

    return (el: HTMLElement | null) => {
        if (el) {
            if (rowsModel.from === rowItemIndex) {
                colsModel.attachItem(el, colItemIndex);
                cachedEl = el;
                mask |= 1;
            }
            if (colsModel.from === colItemIndex) {
                rowsModel.attachItem(el, rowItemIndex);
                cachedEl = el;
                mask |= 2;
            }
        } else {
            if (mask & 1) {
                colsModel.detachItem(cachedEl!);
            }
            if (mask & 2) {
                rowsModel.detachItem(cachedEl!);
            }
            cachedEl = null;
            mask = 0;
        }
    };
};
