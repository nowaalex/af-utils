import {
    VirtualController,
    virtualRange,
    virtualItem
} from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

export default class WindowScroll extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private readonly virtual = new VirtualController(this, () => ({
        itemCount: 5_000
    }));

    connectedCallback() {
        super.connectedCallback();
        this.style.display = "block";
    }

    protected firstUpdated() {
        this.virtual.model.setScroller(window);
    }

    disconnectedCallback() {
        this.virtual.model.setScroller(null);
        super.disconnectedCallback();
    }

    protected render() {
        const model = this.virtual.model;
        return html`<div class=${css.offset1}>Some offset</div>
            <div>
                <div class=${css.offset2}>Some offset 2</div>
                <div>
                    <div
                        ${ref(this.virtual.sizeRef)}
                        role="list"
                        aria-label="Window virtual list"
                    >
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
                                    row ${index}
                                </div>`
                            )}
                        </div>
                    </div>
                </div>
            </div>`;
    }
}

customElements.define("af-virtual-lit-scrolling-window-scroll", WindowScroll);
