import {
    VirtualController,
    virtualRange,
    virtualItem
} from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

const DEFAULT_ROW_COUNT = 50_000;
const sizes = Array.from(
    { length: DEFAULT_ROW_COUNT },
    (_, index) => 20 + ((index ** 2) & 31)
);

export default class VariableSizeList extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private readonly virtual = new VirtualController(this, () => ({
        itemCount: DEFAULT_ROW_COUNT,
        estimatedItemSize: 75
    }));
    private expanded = false;

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
            <div ${ref(this.virtual.sizeRef)}>
                <div ${ref(this.virtual.itemsRef)}>
                    ${virtualRange(
                        model,
                        index => html`<div
                            ${virtualItem(model, index)}
                            class=${css.item}
                            role="listitem"
                            aria-posinset=${index + 1}
                            aria-setsize=${sizes.length}
                            style=${`padding:${sizes[index] + (index === 0 && this.expanded ? 40 : 0)}px 0;background:hsl(${(index * 11) % 360},60%,60%)`}
                        >
                            row ${index}:&nbsp;${sizes[index]}px
                            ${
                                index === 0
                                    ? html`<button
                                          class=${css.toggle}
                                          type="button"
                                          aria-expanded=${this.expanded}
                                          @click=${() => {
                                              this.expanded = !this.expanded;
                                              this.requestUpdate();
                                          }}
                                      >
                                          Toggle first row
                                      </button>`
                                    : null
                            }
                        </div>`
                    )}
                </div>
            </div>
        </div>`;
    }
}

customElements.define("af-virtual-lit-basics-variable-size", VariableSizeList);
