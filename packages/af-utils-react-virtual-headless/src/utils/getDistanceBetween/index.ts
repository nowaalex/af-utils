import type { ScrollToKey, ScrollKey } from "constants/";
import type { ScrollElement } from "types";
import isElement from "utils/isElement";

const getElementOffset = (element: Element, scrollToKey: ScrollToKey) =>
    element.getBoundingClientRect()[scrollToKey];

const getDistanceBetween = (
    scrollElement: ScrollElement | null,
    containerElement: Element | null,
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

export default getDistanceBetween;
