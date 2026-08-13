import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    VirtualController,
    VirtualLayoutController,
    VirtualSnapshotController,
    virtualItem
} from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

const INITIAL_ITEM_COUNT = 10_000;
const PREPEND_BATCH_SIZE = 100;
const SIMULATED_FETCH_DELAY_MS = 500;
const MIN_ITEM_PADDING_PX = 20;
const ITEM_PADDING_VARIANTS = 61;
const ITEM_PADDING_STEP = 37;
const ESTIMATED_ITEM_SIZE_PX = 120;

const createItem = (id: number) => ({
    name: id < 0 ? `Prepended person ${-id}` : `Person ${id}`,
    id,
    height:
        MIN_ITEM_PADDING_PX +
        ((Math.abs(id) * ITEM_PADDING_STEP) % ITEM_PADDING_VARIANTS)
});

const waitForPrependRequest = () =>
    new Promise<void>(resolve => {
        setTimeout(resolve, SIMULATED_FETCH_DELAY_MS);
    });

export default class PrependItems extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private _items = Array.from({ length: INITIAL_ITEM_COUNT }, (_, id) =>
        createItem(id)
    );
    private _loading = false;
    private _nextPrependedId = -1;
    private readonly _virtual = new VirtualController(this, () => ({
        estimatedItemSize: ESTIMATED_ITEM_SIZE_PX,
        itemCount: this._items.length
    }));
    private readonly _snapshot = new VirtualSnapshotController(
        this,
        this._virtual.model,
        VirtualScrollerEvent.RANGE
    );
    private readonly _layout = new VirtualLayoutController(
        this,
        this._virtual.model
    );
    private readonly _headerRef = (element?: Element) =>
        this._virtual.model.setStickyHeader(
            (element as HTMLElement | undefined) ?? null
        );

    connectedCallback() {
        super.connectedCallback();
        this.style.cssText = "display:block;width:100%;height:100%";
    }

    protected firstUpdated() {
        const elements =
            this.renderRoot.querySelectorAll<HTMLElement>("[data-layout]");
        this._layout.connect(elements[0], elements[1], elements[2]);
    }

    private async _prependItems() {
        this._loading = true;
        this.requestUpdate();
        await waitForPrependRequest();
        const newItems = Array.from({ length: PREPEND_BATCH_SIZE }, () =>
            createItem(this._nextPrependedId--)
        );
        const model = this._virtual.model;
        const desiredScrollPosition = newItems.length + model.visibleFrom;
        model.spliceItems(0, 0, newItems.length);
        this._items = [...newItems, ...this._items];
        model.scrollToIndex(desiredScrollPosition);
        this._loading = false;
        this.requestUpdate();
    }

    protected render() {
        const model = this._virtual.model;
        return html`<div
            ${this._layout.scrollerRef}
            data-layout
            style="width:100%;height:100%"
            role="list"
            aria-label="Prepend items list"
        >
            <div ${ref(this._headerRef)} class=${css.listHeader}>
                <button
                    type="button"
                    class=${css.prependButton}
                    ?disabled=${this._loading}
                    @click=${() => void this._prependItems()}
                >
                    ${
                        this._loading
                            ? `Prepend ${PREPEND_BATCH_SIZE} items (loading...)`
                            : `Prepend ${PREPEND_BATCH_SIZE} items`
                    }
                </button>
            </div>
            <div ${this._layout.sizeRef} data-layout>
                <div ${this._layout.itemsRef} data-layout>
                    ${mapVirtualRange(model, index => {
                        const item = this._items[index];
                        return html`<div
                            ${virtualItem(model, index)}
                            class=${css.item}
                            role="listitem"
                            aria-posinset=${index + 1}
                            aria-setsize=${model.itemCount}
                            style=${`padding:${item?.height}px 0.5em`}
                        >
                            Idx:&nbsp;${index};&emsp;${item?.name}
                        </div>`;
                    })}
                </div>
            </div>
        </div>`;
    }
}

customElements.define("af-virtual-lit-list-prepend-items", PrependItems);
