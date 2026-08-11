/** Monomorphic access to axis-specific DOM properties. */
export interface AxisAdapter {
    _readElementOffset(element: HTMLElement): number;
    _readElementSize(element: HTMLElement): number;
    _readWindowOffset(windowObject: Window): number;
    _readWindowSize(windowObject: Window): number;
    _readEntrySize(entry: ResizeObserverEntry): number;
    _readRectStart(rect: DOMRect): number;
    _isElementScrollbarPointer(
        element: HTMLElement,
        event: PointerEvent
    ): boolean;
    _isWindowScrollbarPointer(
        windowObject: Window,
        event: PointerEvent
    ): boolean;
    _scrollElement(
        element: HTMLElement,
        offset: number,
        behavior: ScrollBehavior
    ): void;
    _scrollWindow(
        windowObject: Window,
        offset: number,
        behavior: ScrollBehavior
    ): void;
}

export const verticalAxisAdapter: AxisAdapter = {
    _readElementOffset: element => element.scrollTop,
    _readElementSize: element => element.clientHeight,
    _readWindowOffset: windowObject => windowObject.scrollY,
    _readWindowSize: windowObject => windowObject.innerHeight,
    _readEntrySize: entry => entry.borderBoxSize[0].blockSize,
    _readRectStart: rect => rect.top,
    _isElementScrollbarPointer: (element, event) => {
        const rect = element.getBoundingClientRect();
        const contentStart = rect.left + element.clientLeft;
        return (
            event.clientX < contentStart ||
            event.clientX >= contentStart + element.clientWidth
        );
    },
    _isWindowScrollbarPointer: (windowObject, event) =>
        event.clientX >= windowObject.document.documentElement.clientWidth,
    _scrollElement: (element, offset, behavior) =>
        element.scroll({ top: offset, behavior }),
    _scrollWindow: (windowObject, offset, behavior) =>
        windowObject.scroll({ top: offset, behavior })
};

export const horizontalAxisAdapter: AxisAdapter = {
    _readElementOffset: element => element.scrollLeft,
    _readElementSize: element => element.clientWidth,
    _readWindowOffset: windowObject => windowObject.scrollX,
    _readWindowSize: windowObject => windowObject.innerWidth,
    _readEntrySize: entry => entry.borderBoxSize[0].inlineSize,
    _readRectStart: rect => rect.left,
    _isElementScrollbarPointer: (element, event) => {
        const rect = element.getBoundingClientRect();
        const contentStart = rect.top + element.clientTop;
        return (
            event.clientY < contentStart ||
            event.clientY >= contentStart + element.clientHeight
        );
    },
    _isWindowScrollbarPointer: (windowObject, event) =>
        event.clientY >= windowObject.document.documentElement.clientHeight,
    _scrollElement: (element, offset, behavior) =>
        element.scroll({ left: offset, behavior }),
    _scrollWindow: (windowObject, offset, behavior) =>
        windowObject.scroll({ left: offset, behavior })
};
