import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    VirtualController,
    VirtualLayoutController,
    VirtualSnapshotController,
    virtualItem
} from "@af-utils/virtual-lit";
import { html, LitElement } from "lit";
import { ref } from "lit/directives/ref.js";

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
        this._virtual.model
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
            ${ref(this._layout.scrollerRef)}
            data-layout
            style="width:100%;height:100%"
            role="list"
            aria-label="Simple virtual list"
        >
            <div ${ref(this._layout.sizeRef)} data-layout>
                <div ${ref(this._layout.itemsRef)} data-layout>
                    ${mapVirtualRange(model, index => html`<div ${virtualItem(model, index)} role="listitem" aria-posinset=${index + 1} aria-setsize=${model.itemCount} style="border-top:2px solid #ccc;padding:0.6em">row ${index}</div>`)}
                </div>
            </div>
        </div>`;
    }
}

customElements.define("af-virtual-lit-list-simple", SimpleList);
