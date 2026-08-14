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
    private readonly snapshot = new VirtualSnapshotController(
        this,
        this.virtual.model,
        VirtualScrollerEvent.RANGE
    );
    private readonly layout = new VirtualLayoutController(
        this,
        this.virtual.model
    );

    connectedCallback() {
        super.connectedCallback();
        this.style.cssText = "display:block;width:100%;height:100%";
    }

    protected firstUpdated() {
        const elements =
            this.renderRoot.querySelectorAll<HTMLElement>("[data-layout]");
        this.layout.connect(elements[0], elements[1], elements[2]);
    }

    protected render() {
        const model = this.virtual.model;
        return html`<div
            ${ref(this.layout.scrollerRef)}
            data-layout
            style="width:100%;height:100%"
            class=${css.list}
            role="list"
        >
            <div ${ref(this.layout.sizeRef)} data-layout>
                <div ${ref(this.layout.itemsRef)} data-layout>
                    ${mapVirtualRange(
                        model,
                        index => html`<div
                            ${virtualItem(model, index)}
                            class=${css.item}
                            role="listitem"
                            aria-posinset=${index + 1}
                            aria-setsize=${sizes.length}
                            style=${`padding:${sizes[index]}px 0;background:hsl(${(index * 11) % 360},60%,60%)`}
                        >
                            row ${index}:&nbsp;${sizes[index]}px
                        </div>`
                    )}
                </div>
            </div>
        </div>`;
    }
}

customElements.define(
    "af-virtual-lit-list-variable-size-list",
    VariableSizeList
);
