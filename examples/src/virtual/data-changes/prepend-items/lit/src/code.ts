import {
    VirtualController,
    virtualRange,
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

    private items = Array.from({ length: INITIAL_ITEM_COUNT }, (_, id) =>
        createItem(id)
    );
    private loading = false;
    private nextPrependedId = -1;
    private readonly virtual = new VirtualController(this, () => ({
        estimatedItemSize: ESTIMATED_ITEM_SIZE_PX,
        itemCount: this.items.length
    }));
    private readonly headerRef = (element?: Element) =>
        this.virtual.model.setStickyHeader(
            (element as HTMLElement | undefined) ?? null
        );

    connectedCallback() {
        super.connectedCallback();
        this.style.cssText = "display:block;width:100%;height:100%";
    }

    private async prependItems() {
        this.loading = true;
        this.requestUpdate();
        await waitForPrependRequest();
        const newItems = Array.from({ length: PREPEND_BATCH_SIZE }, () =>
            createItem(this.nextPrependedId--)
        );
        const model = this.virtual.model;
        const desiredScrollPosition = newItems.length + model.visibleFrom;
        model.spliceItems(0, 0, newItems.length);
        this.items = [...newItems, ...this.items];
        model.scrollToIndex(desiredScrollPosition);
        this.loading = false;
        this.requestUpdate();
    }

    protected render() {
        const model = this.virtual.model;
        return html`<div
            ${ref(this.virtual.scrollerRef)}
            style="width:100%;height:100%"
            role="list"
            aria-label="Prepend items list"
        >
            <div ${ref(this.headerRef)} class=${css.listHeader}>
                <button
                    type="button"
                    class=${css.prependButton}
                    ?disabled=${this.loading}
                    @click=${() => void this.prependItems()}
                >
                    ${
                        this.loading
                            ? `Prepend ${PREPEND_BATCH_SIZE} items (loading...)`
                            : `Prepend ${PREPEND_BATCH_SIZE} items`
                    }
                </button>
            </div>
            <div ${ref(this.virtual.sizeRef)}>
                <div ${ref(this.virtual.itemsRef)}>
                    ${virtualRange(
                        model,
                        index => {
                            const item = this.items[index];
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
                        },
                        index => this.items[index]?.id ?? index
                    )}
                </div>
            </div>
        </div>`;
    }
}

customElements.define(
    "af-virtual-lit-data-changes-prepend-items",
    PrependItems
);
