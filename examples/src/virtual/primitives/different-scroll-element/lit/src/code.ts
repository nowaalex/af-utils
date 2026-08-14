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

export default class DifferentScrollElement extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private readonly virtual = new VirtualController(this, () => ({
        itemCount: 5_000
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
            <div class=${css.offset1}>Some offset</div>
            <div>
                <div class=${css.offset2}>Some offset 2</div>
                <div>
                    <div ${ref(this.layout.sizeRef)} data-layout>
                        <div ${ref(this.layout.itemsRef)} data-layout>
                            ${mapVirtualRange(
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
    "af-virtual-lit-primitives-different-scroll-element",
    DifferentScrollElement
);
