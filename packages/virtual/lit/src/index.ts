/** @packageDocumentation Lit controllers and directives used to connect to `VirtualScroller`. */

import {
    mapVirtualRange,
    VirtualScroller,
    VirtualScrollerEvent,
    type VirtualScrollerEventMask,
    type VirtualScrollerInitialParams,
    VirtualScrollerLayout
} from "@af-utils/virtual-core";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import { AsyncDirective } from "lit/async-directive.js";
import { Directive, directive, type DirectiveResult } from "lit/directive.js";
import { createRef, ref } from "lit/directives/ref.js";
import { repeat } from "lit/directives/repeat.js";

/**
 * Lit reactive controller owning a virtual model and its three layout refs.
 * @public
 */
export class VirtualController implements ReactiveController {
    /** Attach the visible scroll viewport. */
    readonly scrollerRef = createRef<HTMLElement>();
    /** Attach the element representing the complete native scroll size. */
    readonly sizeRef = createRef<HTMLElement>();
    /** Attach the element containing only the rendered item range. */
    readonly itemsRef = createRef<HTMLElement>();
    private readonly _host: ReactiveControllerHost;
    private readonly _params: () => VirtualScrollerInitialParams;
    private readonly _hostEvents: VirtualScrollerEventMask;
    private _model: VirtualScroller | null;
    private _layout: VirtualScrollerLayout | null = null;
    private _scrollerElement: HTMLElement | null = null;
    private _sizeElement: HTMLElement | null = null;
    private _itemsElement: HTMLElement | null = null;
    private _connected = false;
    private _unsubscribe: (() => void) | null = null;

    /** Current model, recreated after a terminal host disconnect. */
    get model() {
        return (this._model ??= new VirtualScroller(this._params()));
    }

    /** Return layout bindings for the current model instance. */
    private _getLayout() {
        return (this._layout ??= new VirtualScrollerLayout(this.model));
    }

    /** Reconnect layout elements whose Lit refs changed identity. */
    private _connectLayout() {
        const layout = this._getLayout();
        const scroller = this.scrollerRef.value ?? null;
        const sizeElement = this.sizeRef.value ?? null;
        const itemsElement = this.itemsRef.value ?? null;

        if (scroller !== this._scrollerElement) {
            this._scrollerElement = scroller;
            layout.setScrollerElement(scroller);
        }
        if (sizeElement !== this._sizeElement) {
            this._sizeElement = sizeElement;
            layout.setSizeElement(sizeElement);
        }
        if (itemsElement !== this._itemsElement) {
            this._itemsElement = itemsElement;
            layout.setItemsElement(itemsElement);
        }
    }

    /** Create and register a virtual model controller. */
    constructor(
        host: ReactiveControllerHost,
        params: () => VirtualScrollerInitialParams,
        hostEvents: VirtualScrollerEventMask = 0
    ) {
        this._host = host;
        this._params = params;
        this._hostEvents = hostEvents;
        this._model = new VirtualScroller(params());
        host.addController(this);
    }

    /** Synchronize model parameters after each host update. */
    hostUpdated() {
        this.model.set(this._params());
        this._connectLayout();
    }

    /** Recreate resources after a completed disconnect. */
    hostConnected() {
        this._connected = true;
        if (!this._model) {
            this._model = new VirtualScroller(this._params());
            this._host.requestUpdate();
        }
        this._getLayout();
        if (this._hostEvents) {
            this._unsubscribe ??= this.model.subscribe(
                () => this._host.requestUpdate(),
                this._hostEvents
            );
        }
    }

    /** Dispose model resources with the host. */
    hostDisconnected() {
        this._connected = false;
        this._unsubscribe?.();
        this._unsubscribe = null;
        // Hydration and DOM reparenting can synchronously disconnect and
        // reconnect the same custom element. Disposal is terminal, so wait
        // until the next frame and skip it when `hostConnected` has restored
        // `_connected` in the meantime.
        requestAnimationFrame(() => {
            if (!this._connected) {
                this._layout?.dispose();
                this._layout = null;
                this._model?.dispose();
                this._model = null;
                this._scrollerElement = null;
                this._sizeElement = null;
                this._itemsElement = null;
            }
        });
    }
}

/** Render one item in a Lit virtual range. @public */
export type VirtualRangeRenderer = (index: number) => unknown;

/** Resolve stable item identities after records change index. @public */
export type VirtualRangeGetItemKey = (index: number) => string | number;

/** Default Lit identity for index-stable collections. */
const getIndexItemKey: VirtualRangeGetItemKey = index => index;

class VirtualRangeDirective extends AsyncDirective {
    private _model: VirtualScroller | null = null;
    private _renderItem: VirtualRangeRenderer = () => null;
    private _getItemKey: VirtualRangeGetItemKey = getIndexItemKey;
    private _unsubscribe: (() => void) | null = null;

    /** Render the current range with the latest item renderer. */
    private _renderRange() {
        const model = this._model!;
        return repeat(
            mapVirtualRange(model, index => index),
            this._getItemKey,
            this._renderItem
        );
    }

    /** Subscribe to range-only model events. */
    private _subscribe() {
        this._unsubscribe ??=
            this._model?.subscribe(() => {
                this.setValue(this._renderRange());
            }, VirtualScrollerEvent.RANGE) ?? null;
    }

    /** Update the range subscription and render the current items. */
    render(
        model: VirtualScroller,
        renderItem: VirtualRangeRenderer,
        getItemKey: VirtualRangeGetItemKey = getIndexItemKey
    ) {
        if (model !== this._model) {
            this._unsubscribe?.();
            this._unsubscribe = null;
            this._model = model;
        }
        this._renderItem = renderItem;
        this._getItemKey = getItemKey;
        this._subscribe();
        return this._renderRange();
    }

    /** Pause model updates while the directive is disconnected. */
    disconnected() {
        this._unsubscribe?.();
        this._unsubscribe = null;
    }

    /** Resume model updates after the directive reconnects. */
    reconnected() {
        this._subscribe();
    }
}

const virtualRangeDirective = directive(VirtualRangeDirective);

/** Render only the current model range and subscribe to range changes. @public */
export const virtualRange = (
    model: VirtualScroller,
    renderItem: VirtualRangeRenderer,
    getItemKey: VirtualRangeGetItemKey = getIndexItemKey
): DirectiveResult => virtualRangeDirective(model, renderItem, getItemKey);

class VirtualItemDirective extends Directive {
    private _element: HTMLElement | null = null;
    private _model: VirtualScroller | null = null;
    private _index = -1;

    /** Rebind the measured element when Lit changes the directive target. */
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

    /** Attach the directive element to one virtual item. */
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
): ReturnType<typeof ref> => virtualItemDirective(model, index);

class VirtualGridItemDirective extends Directive {
    private _element: HTMLElement | null = null;
    private _rows: VirtualScroller | null = null;
    private _columns: VirtualScroller | null = null;
    private _row = -1;
    private _column = -1;
    private _attached = 0;

    /** Detach this cell from every axis it currently represents. */
    private _detach() {
        if (!this._element) return;
        if (this._attached & 1) this._columns?.detachItem(this._element);
        if (this._attached & 2) this._rows?.detachItem(this._element);
        this._attached = 0;
    }

    /** Attach this cell to the axes for which it is a representative. */
    private _attach() {
        if (!this._element || !this._rows || !this._columns) return;
        if (this._rows.from === this._row) {
            this._columns.attachItem(this._element, this._column);
            this._attached |= 1;
        }
        if (this._columns.from === this._column) {
            this._rows.attachItem(this._element, this._row);
            this._attached |= 2;
        }
    }

    /** Rebind the measured grid cell when Lit changes the target. */
    private readonly _setElement = (next?: Element) => {
        const element = (next as HTMLElement | undefined) ?? null;
        if (element === this._element) return;

        this._detach();
        this._element = element;
        this._attach();
    };

    /** Attach one cell as an O(rows + columns) grid representative. */
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

/** Lit directive observing O(rows + columns) representative grid cells. @public */
export const virtualGridItem = (
    rows: VirtualScroller,
    row: number,
    columns: VirtualScroller,
    column: number
): ReturnType<typeof ref> =>
    virtualGridItemDirective(rows, row, columns, column);
