import {
    mapVirtualRange,
    VirtualScroller,
    VirtualScrollerEvent,
    VirtualScrollerLayout
} from "@af-utils/virtual-core";
import css from "./style.module.css";

interface Message {
    id: number;
    padding: number;
    text: string;
}

const INITIAL_COUNT = 200;
const EXAMPLE_ELEMENT_TAG = "virtual-core-example";
const createMessage = (id: number): Message => ({
    id,
    padding: 8 + ((id * 13) % 18),
    text: `Message ${id}`
});

class VirtualCoreExample extends HTMLElement {
    private readonly messages = Array.from({ length: INITIAL_COUNT }, (_, id) =>
        createMessage(id)
    );
    private readonly model = new VirtualScroller({
        estimatedItemSize: 52,
        itemCount: this.messages.length
    });
    private readonly layout = new VirtualScrollerLayout(this.model);
    private readonly renderedItems = new Set<HTMLElement>();
    private unsubscribe: (() => void) | undefined;

    connectedCallback() {
        this.innerHTML = `<div class="${css.example}">
            <div class="${css.toolbar}">
                <button type="button" data-append>Append message</button>
                <button type="button" data-jump>Jump to latest</button>
                <output class="${css.status}">${this.messages.length} messages</output>
            </div>
            <div class="${css.list}" role="list" aria-label="Live message feed">
                <div data-size><div data-items></div></div>
            </div>
        </div>`;

        const list = this.querySelector<HTMLElement>('[role="list"]');
        const size = this.querySelector<HTMLElement>("[data-size]");
        const items = this.querySelector<HTMLElement>("[data-items]");
        const output = this.querySelector<HTMLOutputElement>("output");
        const append = this.querySelector<HTMLButtonElement>("[data-append]");
        const jump = this.querySelector<HTMLButtonElement>("[data-jump]");
        if (!list || !size || !items || !output || !append || !jump) {
            throw new Error("Live feed example markup is incomplete");
        }

        this.layout.setScrollerElement(list);
        this.layout.setSizeElement(size);
        this.layout.setItemsElement(items);
        this.unsubscribe = this.model.subscribe(
            () => this.renderRange(items),
            VirtualScrollerEvent.RANGE
        );
        append.addEventListener("click", () => {
            const shouldFollowEnd = this.model.to === this.model.itemCount;
            this.messages.push(createMessage(this.messages.length));
            this.model.setItemCount(this.messages.length);
            output.value = `${this.messages.length} messages`;
            if (shouldFollowEnd) {
                requestAnimationFrame(() => this.scrollToEnd());
            }
        });
        jump.addEventListener("click", () => this.scrollToEnd());
        this.renderRange(items);
        requestAnimationFrame(() => this.scrollToEnd());
        this.dataset.exampleReady = "";
    }

    private scrollToEnd() {
        this.model.scrollToIndex(this.messages.length - 1);
    }

    private renderRange(container: HTMLElement) {
        for (const item of this.renderedItems) this.model.detachItem(item);
        this.renderedItems.clear();
        container.replaceChildren(
            ...mapVirtualRange(this.model, index => {
                const message = this.messages[index];
                const item = document.createElement("div");
                item.className = css.item;
                item.role = "listitem";
                item.ariaPosInSet = String(index + 1);
                item.ariaSetSize = String(this.messages.length);
                item.style.paddingBlock = `${message.padding}px`;
                item.textContent = message.text;
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
