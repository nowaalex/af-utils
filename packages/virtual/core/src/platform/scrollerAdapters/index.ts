import type { AxisAdapter } from "../axisAdapters";

export interface ScrollerAdapter {
    readonly _target: HTMLElement | Window;
    _readOffset(): number;
    _readViewportSize(): number;
    _readEntrySize(entry: ResizeObserverEntry): number;
    _distanceTo(container: HTMLElement | null): number;
    _scrollTo(offset: number, behavior: ScrollBehavior): void;
    _addScrollListener(listener: EventListener): void;
    _removeScrollListener(listener: EventListener): void;
    _supportsScrollEnd(): boolean;
    _addScrollEndListener(listener: EventListener): void;
    _removeScrollEndListener(listener: EventListener): void;
    _observePointerDrag(callback: (active: boolean) => void): () => void;
    _observeResize(callback: (size: number) => void): () => void;
}

const observePointerDrag = (
    target: HTMLElement | Window,
    windowTarget: Window | null,
    isScrollbarPointer: (event: PointerEvent) => boolean,
    callback: (active: boolean) => void
) => {
    if (!windowTarget) {
        return () => {};
    }

    let active = false;
    const handlePointerDown = (event: PointerEvent) => {
        if (event.isPrimary && isScrollbarPointer(event)) {
            active = true;
            callback(true);
        }
    };
    const handlePointerEnd = (event: PointerEvent) => {
        if (event.isPrimary && active) {
            active = false;
            callback(false);
        }
    };

    target.addEventListener("pointerdown", handlePointerDown as EventListener, {
        passive: true
    });
    windowTarget.addEventListener(
        "pointerup",
        handlePointerEnd as EventListener,
        { passive: true }
    );
    windowTarget.addEventListener(
        "pointercancel",
        handlePointerEnd as EventListener,
        { passive: true }
    );

    return () => {
        target.removeEventListener(
            "pointerdown",
            handlePointerDown as EventListener
        );
        windowTarget.removeEventListener(
            "pointerup",
            handlePointerEnd as EventListener
        );
        windowTarget.removeEventListener(
            "pointercancel",
            handlePointerEnd as EventListener
        );
    };
};

const isWindowScroller = (target: HTMLElement | Window): target is Window =>
    (target as Window).window === target;

export const createScrollerAdapter = (
    target: HTMLElement | Window,
    axis: AxisAdapter
): ScrollerAdapter =>
    isWindowScroller(target)
        ? new WindowScrollerAdapter(target, axis)
        : new ElementScrollerAdapter(target, axis);

export class ElementScrollerAdapter implements ScrollerAdapter {
    /** Element whose native scrolling primitives this adapter exposes. */
    readonly _target: HTMLElement;

    /** Monomorphic axis-specific DOM accessors. */
    private readonly _axis: AxisAdapter;

    constructor(target: HTMLElement, axis: AxisAdapter) {
        this._target = target;
        this._axis = axis;
    }

    _readOffset() {
        return this._axis._readElementOffset(this._target);
    }

    _readViewportSize() {
        return this._axis._readElementSize(this._target);
    }

    _readEntrySize(entry: ResizeObserverEntry) {
        return this._axis._readEntrySize(entry);
    }

    _distanceTo(container: HTMLElement | null) {
        // `null` means that items start at the scroll origin. The same-target
        // case must also be zero: the general formula would leave scrollTop or
        // scrollLeft in the result after the two equal rect starts cancel out.
        if (!container || container === this._target) {
            return 0.0;
        }

        return (
            this._readOffset() +
            this._axis._readRectStart(container.getBoundingClientRect()) -
            this._axis._readRectStart(this._target.getBoundingClientRect())
        );
    }

    _scrollTo(offset: number, behavior: ScrollBehavior) {
        this._axis._scrollElement(this._target, offset, behavior);
    }

    _addScrollListener(listener: EventListener) {
        this._target.addEventListener("scroll", listener, { passive: true });
    }

    _removeScrollListener(listener: EventListener) {
        this._target.removeEventListener("scroll", listener);
    }

    _supportsScrollEnd() {
        return "onscrollend" in this._target;
    }

    _addScrollEndListener(listener: EventListener) {
        this._target.addEventListener("scrollend", listener);
    }

    _removeScrollEndListener(listener: EventListener) {
        this._target.removeEventListener("scrollend", listener);
    }

    _observePointerDrag(callback: (active: boolean) => void) {
        return observePointerDrag(
            this._target,
            this._target.ownerDocument?.defaultView ?? null,
            event => this._axis._isElementScrollbarPointer(this._target, event),
            callback
        );
    }

    _observeResize(callback: (size: number) => void) {
        const observer = new ResizeObserver(entries => {
            if (entries.length > 0) {
                callback(this._readEntrySize(entries[entries.length - 1]));
            }
        });

        observer.observe(this._target);
        return () => observer.disconnect();
    }
}

export class WindowScrollerAdapter implements ScrollerAdapter {
    /** Window whose document scrolling primitives this adapter exposes. */
    readonly _target: Window;

    /** Monomorphic axis-specific DOM accessors. */
    private readonly _axis: AxisAdapter;

    constructor(target: Window, axis: AxisAdapter) {
        this._target = target;
        this._axis = axis;
    }

    _readOffset() {
        return this._axis._readWindowOffset(this._target);
    }

    _readViewportSize() {
        return this._axis._readWindowSize(this._target);
    }

    _readEntrySize(entry: ResizeObserverEntry) {
        return this._axis._readEntrySize(entry);
    }

    _distanceTo(container: HTMLElement | null) {
        // A missing items container has no document-space offset to measure.
        if (!container) {
            return 0.0;
        }

        return (
            this._readOffset() +
            this._axis._readRectStart(container.getBoundingClientRect())
        );
    }

    _scrollTo(offset: number, behavior: ScrollBehavior) {
        this._axis._scrollWindow(this._target, offset, behavior);
    }

    _addScrollListener(listener: EventListener) {
        this._target.addEventListener("scroll", listener, { passive: true });
    }

    _removeScrollListener(listener: EventListener) {
        this._target.removeEventListener("scroll", listener);
    }

    _supportsScrollEnd() {
        return "onscrollend" in this._target;
    }

    _addScrollEndListener(listener: EventListener) {
        this._target.addEventListener("scrollend", listener);
    }

    _removeScrollEndListener(listener: EventListener) {
        this._target.removeEventListener("scrollend", listener);
    }

    _observePointerDrag(callback: (active: boolean) => void) {
        return observePointerDrag(
            this._target,
            this._target,
            event => this._axis._isWindowScrollbarPointer(this._target, event),
            callback
        );
    }

    _observeResize(callback: (size: number) => void) {
        const listener = () => callback(this._readViewportSize());

        listener();
        this._target.addEventListener("resize", listener);

        return () => this._target.removeEventListener("resize", listener);
    }
}
