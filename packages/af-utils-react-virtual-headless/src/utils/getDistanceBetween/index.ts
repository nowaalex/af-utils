import type { ScrollToKey } from "constants/";

const getDistanceBetween = (
    scrollElement: HTMLElement | Window | null,
    containerElement: HTMLElement | null,
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
            (scrollElement instanceof Window
                ? 0
                : scrollElement.getBoundingClientRect()[param]))
    );
};

export default getDistanceBetween;
