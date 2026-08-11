/** Monomorphic access to axis-specific DOM properties. */
export interface AxisAdapter {
    /** Read an element's native scroll offset on this axis. */
    _readElementOffset(element: HTMLElement): number;
    /** Read an element's client size on this axis. */
    _readElementSize(element: HTMLElement): number;
    /** Read a window's native scroll offset on this axis. */
    _readWindowOffset(windowObject: Window): number;
    /** Read a window's viewport size on this axis. */
    _readWindowSize(windowObject: Window): number;
    /** Read a resize entry's border-box size on this axis. */
    _readEntrySize(entry: ResizeObserverEntry): number;
    /** Read a DOM rectangle's starting coordinate on this axis. */
    _readRectStart(rect: DOMRect): number;
    /** Return whether a pointer targets an element scrollbar on this axis. */
    _isElementScrollbarPointer(
        element: HTMLElement,
        event: PointerEvent
    ): boolean;
    /** Return whether a pointer targets a window scrollbar on this axis. */
    _isWindowScrollbarPointer(
        windowObject: Window,
        event: PointerEvent
    ): boolean;
    /** Scroll an element to an offset on this axis. */
    _scrollElement(
        element: HTMLElement,
        offset: number,
        behavior: ScrollBehavior
    ): void;
    /** Scroll a window to an offset on this axis. */
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
