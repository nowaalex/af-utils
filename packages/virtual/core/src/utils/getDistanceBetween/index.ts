import type { ScrollToKey, ScrollKey } from "constants/";
import type { ScrollElement } from "types";

const getElementOffset = (element: HTMLElement, scrollToKey: ScrollToKey) =>
    element.getBoundingClientRect()[scrollToKey];

const getDistanceBetween = (
    scrollElement: ScrollElement | null,
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
                (scrollElement instanceof HTMLElement
                    ? getElementOffset(scrollElement as any, scrollToKey)
                    : 0)
        )
    );
};

export default getDistanceBetween;
