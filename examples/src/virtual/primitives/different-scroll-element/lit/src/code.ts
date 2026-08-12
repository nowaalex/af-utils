import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    VirtualController,
    VirtualLayoutController,
    VirtualSnapshotController,
    virtualItem,
    virtualStyle
} from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

export default class DifferentScrollElement extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private readonly _virtual = new VirtualController(this, () => ({
        itemCount: 5_000
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
            class=${css.list}
            style=${virtualStyle(this._layout.scrollerStyle)}
            role="list"
        >
            <div class=${css.offset1}>Some offset</div>
            <div>
                <div class=${css.offset2}>Some offset 2</div>
                <div>
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
