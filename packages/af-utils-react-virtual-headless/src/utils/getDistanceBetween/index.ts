import type { ScrollToKey, ScrollKey } from "constants/";
import type { ScrollElement } from "models/List";

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
        scrollElement[scrollKey] +
        Math.round(
            getElementOffset(containerElement, scrollToKey) -
                (scrollElement instanceof Element
                    ? getElementOffset(scrollElement, scrollToKey)
                    : 0)
        )
    );
};

export default getDistanceBetween;
