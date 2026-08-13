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

export default class WindowScroll extends LitElement {
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
        this._virtual.model
    );

    connectedCallback() {
        super.connectedCallback();
        this.style.display = "block";
    }

    protected firstUpdated() {
        this._virtual.model.setScroller(window);
    }

    disconnectedCallback() {
        this._virtual.model.setScroller(null);
        super.disconnectedCallback();
    }

    protected render() {
        const model = this._virtual.model;
        return html`<div class=${css.offset1}>Some offset</div>
            <div>
                <div class=${css.offset2}>Some offset 2</div>
                <div>
                    <div ${this._layout.sizeRef}>
                        <div ${this._layout.itemsRef}>
                            ${mapVirtualRange(
                                model,
                                index => html`<div
                                    ${virtualItem(model, index)}
                                    class=${css.item}
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

customElements.define("af-virtual-lit-primitives-window-scroll", WindowScroll);
