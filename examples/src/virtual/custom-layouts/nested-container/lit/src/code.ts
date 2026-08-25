import {
    VirtualController,
    virtualRange,
    virtualItem
} from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

export default class NestedContainer extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private readonly virtual = new VirtualController(this, () => ({
        itemCount: 5_000
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
            class=${css.list}
            role="list"
        >
            <div class=${css.offset1}>Some offset</div>
            <div>
                <div class=${css.offset2}>Some offset 2</div>
                <div>
                    <div ${ref(this.virtual.sizeRef)}>
                        <div ${ref(this.virtual.itemsRef)}>
                            ${virtualRange(
                                model,
                                index => html`<div
                                    ${virtualItem(model, index)}
                                    class=${css.item}
                                    role="listitem"
                                >
                                    row ${index}
                                </div>`
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }
}

customElements.define(
    "af-virtual-lit-custom-layouts-nested-container",
    NestedContainer
);
