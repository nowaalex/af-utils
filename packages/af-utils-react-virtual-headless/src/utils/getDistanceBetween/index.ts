import type { ScrollToKey } from "constants/";
import type { ScrollElement } from "models/List";

const getDistanceBetween = (
    scrollElement: ScrollElement | null,
    containerElement: Element | null,
    scrollOffset: number,
    param: ScrollToKey
) => {
    if (
        !containerElement ||
        !scrollElement ||
        scrollElement === containerElement
    ) {
        return 0;
    }

    return (
        scrollOffset +
        (containerElement.getBoundingClientRect()[param] -
            (scrollElement instanceof Element
                ? scrollElement.getBoundingClientRect()[param]
                : 0))
    );
};

export default getDistanceBetween;
