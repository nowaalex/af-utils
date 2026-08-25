import {
    VirtualController,
    virtualRange,
    virtualItem
} from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

export default class HorizontalList extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private readonly virtual = new VirtualController(this, () => ({
        itemCount: 50_000,
        estimatedItemSize: 75,
        horizontal: true
    }));

    connectedCallback() {
        super.connectedCallback();
        this.style.cssText = "display:block;width:100%;height:100%";
    }

    protected render() {
        const model = this.virtual.model;
        return html`<div
            ${ref(this.virtual.scrollerRef)}
            role="list"
            aria-label="Horizontal virtual list"
            style="width:100%;height:100%"
        >
            <div ${ref(this.virtual.sizeRef)}>
                <div ${ref(this.virtual.itemsRef)}>
                    ${virtualRange(
                        model,
                        index => html`<div
                            ${virtualItem(model, index)}
                            class=${index % 2 ? css.oddItem : css.evenItem}
                            role="listitem"
                            aria-posinset=${index + 1}
                            aria-setsize=${model.itemCount}
                        >
                            col&nbsp;${index}
                        </div>`
                    )}
                </div>
            </div>
        </div>`;
    }
}

customElements.define("af-virtual-lit-basics-horizontal", HorizontalList);
