import type { AxisAdapter } from "../axisAdapters";

export interface ScrollerAdapter {
    /** Return whether this adapter already owns the supplied scroll target. */
    _matchesTarget(target: HTMLElement | Window): boolean;
    /** Read the native scroll offset on the configured axis. */
    _readOffset(): number;
    /** Read the viewport size on the configured axis. */
    _readViewportSize(): number;
    /** Read an observed border-box size on the configured axis. */
    _readEntrySize(entry: ResizeObserverEntry): number;
    /** Measure a container's offset from the native scroll origin. */
    _distanceTo(container: HTMLElement | null): number;
    /** Scroll to a native axis offset. */
    _scrollTo(offset: number, behavior: ScrollBehavior): void;
    /** Attach a native scroll listener. */
    _addScrollListener(listener: EventListener): void;
    /** Detach a native scroll listener. */
    _removeScrollListener(listener: EventListener): void;
    /** Return whether native `scrollend` is supported. */
    _supportsScrollEnd(): boolean;
    /** Attach a native `scrollend` listener. */
    _addScrollEndListener(listener: EventListener): void;
    /** Detach a native `scrollend` listener. */
    _removeScrollEndListener(listener: EventListener): void;
    /** Observe viewport size changes. */
    _observeResize(callback: (size: number) => void): () => void;
    /** Observe primary-pointer interaction associated with this scroll target. */
    _observePointer(start: EventListener, end: EventListener): () => void;
}

/** Narrow a supported scroll target to `Window`. */
const isWindowScroller = (target: HTMLElement | Window): target is Window =>
    (target as Window).window === target;

/** Create the monomorphic adapter matching a native scroll target. */
export const createScrollerAdapter = (
    target: HTMLElement | Window,
    axis: AxisAdapter
): ScrollerAdapter =>
    isWindowScroller(target)
        ? new WindowScrollerAdapter(target, axis)
        : new ElementScrollerAdapter(target, axis);

export class ElementScrollerAdapter implements ScrollerAdapter {
    /** Element whose native scrolling primitives this adapter exposes. */
    private readonly _target: HTMLElement;

    /** Monomorphic axis-specific DOM accessors. */
    private readonly _axis: AxisAdapter;

    /** Create an adapter for an element scroll container. */
    constructor(target: HTMLElement, axis: AxisAdapter) {
        this._target = target;
        this._axis = axis;
    }

    /** Return whether this adapter owns the supplied scroll target. */
    _matchesTarget(target: HTMLElement | Window) {
        return target === this._target;
    }

    /** Read the element's native axis offset. */
    _readOffset() {
        return this._axis._readElementOffset(this._target);
    }

    /** Read the element's client size on the scrolling axis. */
    _readViewportSize() {
        return this._axis._readElementSize(this._target);
    }

    /** Read an observed border-box size on the scrolling axis. */
    _readEntrySize(entry: ResizeObserverEntry) {
        return this._axis._readEntrySize(entry);
    }

    /** Measure an items container from the element's scroll origin. */
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

    /** Scroll the element to an axis offset. */
    _scrollTo(offset: number, behavior: ScrollBehavior) {
        this._axis._scrollElement(this._target, offset, behavior);
    }

    /** Attach a passive element scroll listener. */
    _addScrollListener(listener: EventListener) {
        this._target.addEventListener("scroll", listener, { passive: true });
    }

    /** Detach an element scroll listener. */
    _removeScrollListener(listener: EventListener) {
        this._target.removeEventListener("scroll", listener);
    }

    /** Return whether the element exposes native `scrollend`. */
    _supportsScrollEnd() {
        return "onscrollend" in this._target;
    }

    /** Attach an element `scrollend` listener. */
    _addScrollEndListener(listener: EventListener) {
        this._target.addEventListener("scrollend", listener);
    }

    /** Detach an element `scrollend` listener. */
    _removeScrollEndListener(listener: EventListener) {
        this._target.removeEventListener("scrollend", listener);
    }

    /** Observe changes to the element's border-box size. */
    _observeResize(callback: (size: number) => void) {
        const observer = new ResizeObserver(entries => {
            if (entries.length > 0) {
                callback(this._readEntrySize(entries[entries.length - 1]));
            }
        });

        observer.observe(this._target);
        return () => observer.disconnect();
    }

    /** Observe pointer start on the element and release in its owning window. */
    _observePointer(start: EventListener, end: EventListener) {
        const windowObject = this._target.ownerDocument?.defaultView;

        this._target.addEventListener("pointerdown", start);
        windowObject?.addEventListener("pointerup", end);
        windowObject?.addEventListener("pointercancel", end);

        return () => {
            this._target.removeEventListener("pointerdown", start);
            windowObject?.removeEventListener("pointerup", end);
            windowObject?.removeEventListener("pointercancel", end);
        };
    }
}

export class WindowScrollerAdapter implements ScrollerAdapter {
    /** Window whose document scrolling primitives this adapter exposes. */
    private readonly _target: Window;

    /** Monomorphic axis-specific DOM accessors. */
    private readonly _axis: AxisAdapter;

    /** Create an adapter for a window scroll container. */
    constructor(target: Window, axis: AxisAdapter) {
        this._target = target;
        this._axis = axis;
    }

    /** Return whether this adapter owns the supplied scroll target. */
    _matchesTarget(target: HTMLElement | Window) {
        return target === this._target;
    }

    /** Read the window's native axis offset. */
    _readOffset() {
        return this._axis._readWindowOffset(this._target);
    }

    /** Read the window viewport size on the scrolling axis. */
    _readViewportSize() {
        return this._axis._readWindowSize(this._target);
    }

    /** Read an observed border-box size on the scrolling axis. */
    _readEntrySize(entry: ResizeObserverEntry) {
        return this._axis._readEntrySize(entry);
    }

    /** Measure an items container from the document scroll origin. */
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

    /** Scroll the window to an axis offset. */
    _scrollTo(offset: number, behavior: ScrollBehavior) {
        this._axis._scrollWindow(this._target, offset, behavior);
    }

    /** Attach a passive window scroll listener. */
    _addScrollListener(listener: EventListener) {
        this._target.addEventListener("scroll", listener, { passive: true });
    }

    /** Detach a window scroll listener. */
    _removeScrollListener(listener: EventListener) {
        this._target.removeEventListener("scroll", listener);
    }

    /** Return whether the window exposes native `scrollend`. */
    _supportsScrollEnd() {
        return "onscrollend" in this._target;
    }

    /** Attach a window `scrollend` listener. */
    _addScrollEndListener(listener: EventListener) {
        this._target.addEventListener("scrollend", listener);
    }

    /** Detach a window `scrollend` listener. */
    _removeScrollEndListener(listener: EventListener) {
        this._target.removeEventListener("scrollend", listener);
    }

    /** Observe changes to the window viewport size. */
    _observeResize(callback: (size: number) => void) {
        // TODO: Replace the window resize listener with ResizeObserver only if
        // observing documentElement proves equivalent for visual-viewport,
        // mobile browser chrome, zoom, and scrollbar-driven viewport changes.
        // ResizeObserver cannot observe Window directly, so changing this
        // without that cross-browser proof would trade correctness for a
        // speculative performance improvement.
        const listener = () => callback(this._readViewportSize());

        listener();
        this._target.addEventListener("resize", listener);

        return () => this._target.removeEventListener("resize", listener);
    }

    /** Observe the complete pointer interaction on the target window. */
    _observePointer(start: EventListener, end: EventListener) {
        this._target.addEventListener("pointerdown", start);
        this._target.addEventListener("pointerup", end);
        this._target.addEventListener("pointercancel", end);

        return () => {
            this._target.removeEventListener("pointerdown", start);
            this._target.removeEventListener("pointerup", end);
            this._target.removeEventListener("pointercancel", end);
        };
    }
}
