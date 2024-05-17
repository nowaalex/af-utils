import type { ScrollToKey, ScrollKey } from "constants/";
import type { VirtualScrollerScrollElement } from "types";

export const call = (fn: (...args: unknown[]) => void) => fn();

export const growTypedArray = (
    sourceArray: Uint32Array,
    newLength: number,
    fillValue: number
) => {
    const resultArray = new Uint32Array(newLength);
    resultArray.fill(fillValue, sourceArray.length).set(sourceArray);
    return resultArray;
};

export const isElement = (el: VirtualScrollerScrollElement | null) =>
    el instanceof HTMLElement;

const getElementOffset = (element: HTMLElement, scrollToKey: ScrollToKey) =>
    element.getBoundingClientRect()[scrollToKey];

export const getDistanceBetween = (
    scrollElement: VirtualScrollerScrollElement | null,
    containerElement: HTMLElement | null,
    scrollKey: ScrollKey,
    scrollToKey: ScrollToKey
) => {
    if (
        scrollElement === containerElement ||
        !containerElement ||
        !scrollElement
    ) {
        return 0;
    }

    return (
        (scrollElement as any)[scrollKey] +
        Math.round(
            getElementOffset(containerElement, scrollToKey) -
                (isElement(scrollElement)
                    ? getElementOffset(scrollElement as any, scrollToKey)
                    : 0)
        )
    );
};
