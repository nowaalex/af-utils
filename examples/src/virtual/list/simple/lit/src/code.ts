import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    VirtualController,
    VirtualLayoutController,
    VirtualSnapshotController,
    virtualItem,
    virtualStyle
} from "@af-utils/virtual-lit";
import { html, LitElement } from "lit";

export default class SimpleList extends LitElement {
    private readonly _virtual = new VirtualController(this, () => ({
        itemCount: 150_000
    }));
    private readonly _snapshot = new VirtualSnapshotController(
        this,
        this._virtual.model,
        VirtualScrollerEvent.RANGE
    );
    private readonly _layout = new VirtualLayoutController(
        this,
        this._virtual.model,
        { width: "100%", height: "100%" }
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

    protected render() {
        const model = this._virtual.model;
        return html`<div
            ${this._layout.scrollerRef}
            data-layout
            style=${virtualStyle(this._layout.scrollerStyle)}
            role="list"
            aria-label="Simple virtual list"
        >
            <div
                ${this._layout.sizeRef}
                data-layout
                style=${virtualStyle(this._layout.sizeStyle)}
            >
                <div
                    ${this._layout.itemsRef}
                    data-layout
                    style=${virtualStyle(this._layout.itemsStyle)}
                >
                    ${mapVirtualRange(model, index => html`<div ${virtualItem(model, index)} role="listitem" aria-posinset=${index + 1} aria-setsize=${model.itemCount} style="border-top:2px solid #ccc;padding:0.6em">row ${index}</div>`)}
                </div>
            </div>
        </div>`;
    }
}

customElements.define("af-virtual-lit-list-simple", SimpleList);
