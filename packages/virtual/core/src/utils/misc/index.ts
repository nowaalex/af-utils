import type { ScrollToKey, ScrollKey } from "constants/";
import type { VirtualScrollerScrollElement } from "types";

export const call = (fn: (...args: unknown[]) => void) => fn();

export const growTypedArray = (
    sourceArray: ArrayLike<number>,
    newLength: number,
    fillValue: number
) => {
    const resultArray = new Uint32Array(newLength);
    resultArray.set(sourceArray);
    resultArray.fill(fillValue, sourceArray.length);
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
        !containerElement ||
        !scrollElement ||
        scrollElement === containerElement
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
