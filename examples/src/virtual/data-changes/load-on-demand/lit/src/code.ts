import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    VirtualController,
    virtualRange,
    virtualItem
} from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

const descriptionParts = [
    "Virtualized content stays responsive as the collection grows.",
    "Only the visible range is mounted and measured.",
    "This deterministic text keeps framework screenshots comparable."
];

const createDescriptions = (start: number) => {
    const descriptions: string[] = [];

    for (let offset = 0; offset < 5; offset++) {
        const parts: string[] = [];
        const partCount = 1 + ((start + offset) % descriptionParts.length);

        for (let part = 0; part < partCount; part++) {
            parts.push(
                descriptionParts[
                    (start + offset + part) % descriptionParts.length
                ]
            );
        }
        descriptions.push(parts.join(" "));
    }

    return descriptions;
};

const fetchDescriptions = (start: number) =>
    new Promise<string[]>(resolve => {
        setTimeout(resolve, 200, createDescriptions(start));
    });

export default class Posts extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private posts = createDescriptions(0);
    private loading = false;
    private readonly virtual = new VirtualController(
        this,
        () => ({
            itemCount: this.posts.length,
            estimatedItemSize: 500
        }),
        VirtualScrollerEvent.RANGE
    );

    connectedCallback() {
        super.connectedCallback();
        this.style.cssText = "display:block;width:100%;height:100%";
    }

    protected updated() {
        void this.loadMore();
    }

    private async loadMore() {
        const model = this.virtual.model;
        if (this.loading || this.posts.length !== model.to) return;
        this.loading = true;
        const paragraphs = await fetchDescriptions(this.posts.length);
        this.loading = false;
        this.posts = [...this.posts, ...paragraphs];
        this.requestUpdate();
    }

    protected render() {
        const model = this.virtual.model;
        return html`<div
            ${ref(this.virtual.scrollerRef)}
            style="width:100%;height:100%"
            role="list"
            aria-label="Load on demand list"
        >
            <div ${ref(this.virtual.sizeRef)}>
                <div ${ref(this.virtual.itemsRef)}>
                    ${virtualRange(
                        model,
                        index => html`<div
                            ${virtualItem(model, index)}
                            class=${css.item}
                            role="listitem"
                            aria-posinset=${index + 1}
                            aria-setsize=${model.itemCount}
                        >
                            <div class=${css.itemHeader}>some picture</div>
                            <p>${this.posts[index]}</p>
                        </div>`
                    )}
                </div>
            </div>
        </div>`;
    }
}

customElements.define("af-virtual-lit-data-changes-load-on-demand", Posts);
