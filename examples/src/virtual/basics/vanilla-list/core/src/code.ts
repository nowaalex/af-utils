import {
    mapVirtualRange,
    VirtualScroller,
    VirtualScrollerEvent,
    VirtualScrollerLayout
} from "@af-utils/virtual-core";
import css from "./style.module.css";

const ITEM_COUNT = 50_000;
const EXAMPLE_ELEMENT_TAG = "virtual-core-example";

class VirtualCoreExample extends HTMLElement {
    private readonly model = new VirtualScroller({
        estimatedItemSize: 42,
        itemCount: ITEM_COUNT
    });
    private readonly layout = new VirtualScrollerLayout(this.model);
    private readonly renderedItems = new Set<HTMLElement>();
    private unsubscribe: (() => void) | undefined;

    connectedCallback() {
        this.innerHTML = `
            <div class="${css.example}">
                <form class="${css.controls}">
                    <label>Item <input name="index" type="number" min="0" max="${ITEM_COUNT - 1}" value="1000"></label>
                    <button type="submit">Scroll to item</button>
                    <button type="button" data-reset-sizes>Reset measurements</button>
                    <output class="${css.status}" aria-live="polite">Ready</output>
                </form>
                <div class="${css.list}" role="list" aria-label="Core virtual list">
                    <div data-size><div data-items></div></div>
                </div>
            </div>`;

        const list = this.querySelector<HTMLElement>('[role="list"]');
        const size = this.querySelector<HTMLElement>("[data-size]");
        const items = this.querySelector<HTMLElement>("[data-items]");
        const form = this.querySelector<HTMLFormElement>("form");
        const output = this.querySelector<HTMLOutputElement>("output");
        const input = this.querySelector<HTMLInputElement>(
            'input[name="index"]'
        );
        const reset =
            this.querySelector<HTMLButtonElement>("[data-reset-sizes]");
        if (!list || !size || !items || !form || !output || !input || !reset) {
            throw new Error("Virtual core example markup is incomplete");
        }

        this.layout.setScrollerElement(list);
        this.layout.setSizeElement(size);
        this.layout.setItemsElement(items);
        this.unsubscribe = this.model.subscribe(
            () => this.renderRange(items),
            VirtualScrollerEvent.RANGE
        );
        form.addEventListener("submit", event => {
            event.preventDefault();
            const index = Math.min(
                ITEM_COUNT - 1,
                Math.max(0, input.valueAsNumber || 0)
            );
            const offset = this.model.getOffset(index);
            output.value = `Offset ${Math.round(offset)}px resolves to item ${this.model.getIndex(offset + 0.5)}`;
            this.model.scrollToOffset(offset);
        });
        reset.addEventListener("click", () => {
            this.model.invalidateItemSizes();
            output.value = "Measurements reset";
        });
        this.renderRange(items);
        this.dataset.exampleReady = "";
    }

    private renderRange(container: HTMLElement) {
        for (const item of this.renderedItems) this.model.detachItem(item);
        this.renderedItems.clear();
        container.replaceChildren(
            ...mapVirtualRange(this.model, index => {
                const item = document.createElement("div");
                item.className = css.item;
                item.role = "listitem";
                item.ariaPosInSet = String(index + 1);
                item.ariaSetSize = String(ITEM_COUNT);
                item.textContent = `row ${index}`;
                this.model.attachItem(item, index);
                this.renderedItems.add(item);
                return item;
            })
        );
    }

    disconnectedCallback() {
        this.unsubscribe?.();
        this.layout.dispose();
        this.model.dispose();
    }
}

if (!customElements.get(EXAMPLE_ELEMENT_TAG)) {
    customElements.define(EXAMPLE_ELEMENT_TAG, VirtualCoreExample);
}
