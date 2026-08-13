/** @packageDocumentation Lit controllers and directives used to connect to `VirtualScroller`. */

import {
    VirtualScroller,
    VirtualScrollerEvent,
    type VirtualScrollerEventMask,
    type VirtualScrollerInitialParams,
    VirtualScrollerLayout,
    type VirtualScrollerRuntimeParams
} from "@af-utils/virtual-core";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import { Directive, directive } from "lit/directive.js";
import { ref, type RefOrCallback } from "lit/directives/ref.js";

type RuntimeParamsSnapshot = Readonly<
    Required<Pick<VirtualScrollerRuntimeParams, "itemCount">> &
        Pick<
            VirtualScrollerRuntimeParams,
            "estimatedItemSize" | "overscanCount"
        >
>;

const getRuntimeParamsSnapshot = (
    params: VirtualScrollerInitialParams
): RuntimeParamsSnapshot => ({
    estimatedItemSize: params.estimatedItemSize,
    itemCount: params.itemCount ?? 0,
    overscanCount: params.overscanCount
});

const runtimeParamsChanged = (
    previous: RuntimeParamsSnapshot,
    next: RuntimeParamsSnapshot
) =>
    previous.estimatedItemSize !== next.estimatedItemSize ||
    previous.itemCount !== next.itemCount ||
    previous.overscanCount !== next.overscanCount;

/** Lit reactive controller owning one virtual-scroller model. @public */
export class VirtualController implements ReactiveController {
    readonly model: VirtualScroller;
    private readonly _host: ReactiveControllerHost;
    private readonly _params: () => VirtualScrollerInitialParams;
    private _runtimeParams: RuntimeParamsSnapshot;
    private _connected = false;

    /** Create and register a virtual model controller. */
    constructor(
        host: ReactiveControllerHost,
        params: () => VirtualScrollerInitialParams
    ) {
        this._host = host;
        this._params = params;
        const initialParams = params();
        this._runtimeParams = getRuntimeParamsSnapshot(initialParams);
        this.model = new VirtualScroller(initialParams);
        host.addController(this);
    }

    /** Synchronize model parameters after each host update. */
    hostUpdated() {
        const params = this._params();
        const runtimeParams = getRuntimeParamsSnapshot(params);

        if (runtimeParamsChanged(this._runtimeParams, runtimeParams)) {
            this.model.set(params);
            this._runtimeParams = runtimeParams;
        }
    }

    /** Preserve the model across transient DOM moves during hydration. */
    hostConnected() {
        this._connected = true;
    }

    /** Dispose model resources with the host. */
    hostDisconnected() {
        this._connected = false;
        // Hydration and DOM reparenting can synchronously disconnect and
        // reconnect the same custom element. Disposal is terminal, so wait
        // until the next frame and skip it when `hostConnected` has restored
        // `_connected` in the meantime.
        requestAnimationFrame(() => {
            if (!this._connected) this.model.dispose();
        });
    }
}

/** Lit controller that requests host updates for selected model events. @public */
export class VirtualSnapshotController implements ReactiveController {
    private readonly _host: ReactiveControllerHost;
    private readonly _model: VirtualScroller;
    private readonly _events: VirtualScrollerEventMask;
    private _unsubscribe: (() => void) | null = null;

    /** Create and register an event bridge. */
    constructor(
        host: ReactiveControllerHost,
        model: VirtualScroller,
        events: VirtualScrollerEventMask = VirtualScrollerEvent.RANGE
    ) {
        this._host = host;
        this._model = model;
        this._events = events;
        host.addController(this);
    }

    /** Subscribe when the host connects. */
    hostConnected() {
        this._unsubscribe ??= this._model.subscribe(
            () => this._host.requestUpdate(),
            this._events
        );
    }

    /** Unsubscribe when the host disconnects. */
    hostDisconnected() {
        this._unsubscribe?.();
        this._unsubscribe = null;
    }
}

/** Lit refs backed by the framework-neutral layout adapter. @public */
export class VirtualLayoutController implements ReactiveController {
    readonly scrollerRef: RefOrCallback;
    readonly sizeRef: RefOrCallback;
    readonly itemsRef: RefOrCallback;
    private readonly _layout: VirtualScrollerLayout;
    private _connected = false;

    /** Create layout bindings for a Lit host. */
    constructor(host: ReactiveControllerHost, model: VirtualScroller) {
        this._layout = new VirtualScrollerLayout(model);
        this.scrollerRef = element =>
            this._layout.setScrollerElement(element as HTMLElement | null);
        this.sizeRef = element =>
            this._layout.setSizeElement(element as HTMLElement | null);
        this.itemsRef = element =>
            this._layout.setItemsElement(element as HTMLElement | null);
        host.addController(this);
    }

    /** Explicitly reconnect layout elements after an external hydration pass. */
    connect(
        scroller: HTMLElement,
        sizeElement: HTMLElement,
        itemsElement: HTMLElement
    ) {
        this._layout.setScrollerElement(scroller);
        this._layout.setSizeElement(sizeElement);
        this._layout.setItemsElement(itemsElement);
    }

    /** Mark the layout controller as attached. */
    hostConnected() {
        this._connected = true;
    }

    /** Dispose DOM bindings with the host. */
    hostDisconnected() {
        this._connected = false;
        // Lit can retain rendered DOM across a transient reparent, so its ref
        // callbacks need not run again. Delaying disposal preserves the
        // bindings when the host reconnects before the next frame.
        requestAnimationFrame(() => {
            if (!this._connected) this._layout.dispose();
        });
    }
}

class VirtualItemDirective extends Directive {
    private _element: HTMLElement | null = null;
    private _model: VirtualScroller | null = null;
    private _index = -1;

    private readonly _setElement = (next?: Element) => {
        const element = (next as HTMLElement | undefined) ?? null;
        if (element === this._element) return;

        if (this._element && this._model) {
            this._model.detachItem(this._element);
        }
        this._element = element;
        if (element && this._model)
            this._model.attachItem(element, this._index);
    };

    render(model: VirtualScroller, index: number) {
        if (model !== this._model || index !== this._index) {
            if (this._element && this._model) {
                this._model.detachItem(this._element);
            }
            this._model = model;
            this._index = index;
            if (this._element) model.attachItem(this._element, index);
        }

        return ref(this._setElement);
    }
}

const virtualItemDirective = directive(VirtualItemDirective);

/** Lit element directive that observes one rendered virtual item. @public */
export const virtualItem = (
    model: VirtualScroller,
    index: number
): ReturnType<typeof ref> =>
    virtualItemDirective(model, index) as ReturnType<typeof ref>;

class VirtualGridItemDirective extends Directive {
    private _element: HTMLElement | null = null;
    private _rows: VirtualScroller | null = null;
    private _columns: VirtualScroller | null = null;
    private _row = -1;
    private _column = -1;

    private _detach() {
        if (!this._element) return;
        this._rows?.detachItem(this._element);
        this._columns?.detachItem(this._element);
    }

    private _attach() {
        if (!this._element || !this._rows || !this._columns) return;
        this._rows.attachItem(this._element, this._row);
        this._columns.attachItem(this._element, this._column);
    }

    private readonly _setElement = (next?: Element) => {
        const element = (next as HTMLElement | undefined) ?? null;
        if (element === this._element) return;

        this._detach();
        this._element = element;
        this._attach();
    };

    render(
        rows: VirtualScroller,
        row: number,
        columns: VirtualScroller,
        column: number
    ) {
        if (
            rows !== this._rows ||
            row !== this._row ||
            columns !== this._columns ||
            column !== this._column
        ) {
            this._detach();
            this._rows = rows;
            this._row = row;
            this._columns = columns;
            this._column = column;
            this._attach();
        }

        return ref(this._setElement);
    }
}

const virtualGridItemDirective = directive(VirtualGridItemDirective);

/** Lit element directive observed as both a virtual row and column. @public */
export const virtualGridItem = (
    rows: VirtualScroller,
    row: number,
    columns: VirtualScroller,
    column: number
): ReturnType<typeof ref> =>
    virtualGridItemDirective(rows, row, columns, column) as ReturnType<
        typeof ref
    >;
