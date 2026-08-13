import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    VirtualController,
    VirtualLayoutController,
    VirtualSnapshotController,
    virtualItem
} from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

export default class HorizontalList extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private readonly _virtual = new VirtualController(this, () => ({
        itemCount: 50_000,
        estimatedItemSize: 75,
        horizontal: true
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
            ${this._layout.scrollerRef}
            data-layout
            style="width:100%;height:100%"
        >
            <div ${this._layout.sizeRef} data-layout>
                <div ${this._layout.itemsRef} data-layout>
                    ${mapVirtualRange(
                        model,
                        index => html`<div
                            ${virtualItem(model, index)}
                            class=${index % 2 ? css.oddItem : css.evenItem}
                        >
                            col&nbsp;${index}
                        </div>`
                    )}
                </div>
            </div>
        </div>`;
    }
}

customElements.define("af-virtual-lit-list-horizontal", HorizontalList);
