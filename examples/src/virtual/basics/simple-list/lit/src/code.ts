import {
    VirtualController,
    virtualRange,
    virtualItem
} from "@af-utils/virtual-lit";
import { html, LitElement } from "lit";
import { ref } from "lit/directives/ref.js";

export default class SimpleList extends LitElement {
    private readonly virtual = new VirtualController(this, () => ({
        itemCount: 150_000
    }));

    connectedCallback() {
        super.connectedCallback();
        this.style.cssText = "display:block;width:100%;height:100%";
    }

    protected render() {
        const model = this.virtual.model;
        return html`<div
            ${ref(this.virtual.scrollerRef)}
            style="width:100%;height:100%"
            role="list"
            aria-label="Simple virtual list"
        >
            <div ${ref(this.virtual.sizeRef)}>
                <div ${ref(this.virtual.itemsRef)}>
                    ${virtualRange(model, index => html`<div ${virtualItem(model, index)} role="listitem" aria-posinset=${index + 1} aria-setsize=${model.itemCount} style="border-top:2px solid #ccc;padding:0.6em">row ${index}</div>`)}
                </div>
            </div>
        </div>`;
    }
}

customElements.define("af-virtual-lit-basics-simple-list", SimpleList);
