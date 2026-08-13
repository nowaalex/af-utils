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

const descriptionParts = [
    "Virtualized content stays responsive as the collection grows.",
    "Only the visible range is mounted and measured.",
    "This deterministic text keeps framework screenshots comparable."
];

const createDescriptions = (start: number) =>
    Array.from({ length: 5 }, (_description, offset) =>
        Array.from(
            { length: 1 + ((start + offset) % descriptionParts.length) },
            (_part, part) =>
                descriptionParts[
                    (start + offset + part) % descriptionParts.length
                ]
        ).join(" ")
    );

const fetchDescriptions = (start: number) =>
    new Promise<string[]>(resolve => {
        setTimeout(resolve, 200, createDescriptions(start));
    });

export default class Posts extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private _posts = createDescriptions(0);
    private _loading = false;
    private _unsubscribe: (() => void) | null = null;
    private readonly _virtual = new VirtualController(this, () => ({
        itemCount: this._posts.length,
        estimatedItemSize: 500
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

    connectedCallback() {
        super.connectedCallback();
        this.style.cssText = "display:block;width:100%;height:100%";
    }

    disconnectedCallback() {
        this._unsubscribe?.();
        this._unsubscribe = null;
        super.disconnectedCallback();
    }

    protected firstUpdated() {
        const elements =
            this.renderRoot.querySelectorAll<HTMLElement>("[data-layout]");
        this._layout.connect(elements[0], elements[1], elements[2]);
        this._unsubscribe = this._virtual.model.subscribe(
            () => void this._loadMore(),
            VirtualScrollerEvent.RANGE
        );
        void this._loadMore();
    }

    private async _loadMore() {
        const model = this._virtual.model;
        if (this._loading || this._posts.length !== model.to) return;
        this._loading = true;
        const paragraphs = await fetchDescriptions(this._posts.length);
        this._loading = false;
        this._posts = [...this._posts, ...paragraphs];
        this.requestUpdate();
    }

    protected render() {
        const model = this._virtual.model;
        return html`<div
            ${ref(this._layout.scrollerRef)}
            data-layout
            style="width:100%;height:100%"
            role="list"
            aria-label="Load on demand list"
        >
            <div ${ref(this._layout.sizeRef)} data-layout>
                <div ${ref(this._layout.itemsRef)} data-layout>
                    ${mapVirtualRange(
                        model,
                        index => html`<div
                            ${virtualItem(model, index)}
                            class=${css.item}
                            role="listitem"
                            aria-posinset=${index + 1}
                            aria-setsize=${model.itemCount}
                        >
                            <div class=${css.itemHeader}>some picture</div>
                            <p>${this._posts[index]}</p>
                        </div>`
                    )}
                </div>
            </div>
        </div>`;
    }
}

customElements.define("af-virtual-lit-list-load-on-demand", Posts);
