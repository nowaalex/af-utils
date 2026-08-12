import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    VirtualController,
    VirtualLayoutController,
    VirtualSnapshotController,
    virtualItem,
    virtualStyle
} from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

export default class ExtraEvents extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private readonly _virtual = new VirtualController(this, () => ({
        itemCount: 150_000,
        estimatedItemSize: 35
    }));
    private readonly _rangeSnapshot = new VirtualSnapshotController(
        this,
        this._virtual.model,
        VirtualScrollerEvent.RANGE
    );
    private readonly _scrollSizeSnapshot = new VirtualSnapshotController(
        this,
        this._virtual.model,
        VirtualScrollerEvent.SCROLL_SIZE
    );
    private readonly _layout = new VirtualLayoutController(
        this,
        this._virtual.model,
        { width: "100%", height: "100%" }
    );
    private readonly _headerRef = (element?: Element) =>
        this._virtual.model.setStickyHeader(
            (element as HTMLElement | undefined) ?? null
        );
    private readonly _footerRef = (element?: Element) =>
        this._virtual.model.setStickyFooter(
            (element as HTMLElement | undefined) ?? null
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
            style=${virtualStyle(this._layout.scrollerStyle)}
            role="list"
            aria-label="Extra events list"
        >
            <div ${ref(this._headerRef)} class=${`${css.row} ${css.top0}`}>
                Rendered ${model.to - model.from} items. Range: ${model.from} -
                ${model.to}
            </div>
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
                            aria-posinset=${index + 1}
                            aria-setsize=${model.itemCount}
                        >
                            row ${index}
                        </div>`
                    )}
                </div>
            </div>
            <div ${ref(this._footerRef)} class=${`${css.row} ${css.bottom0}`}>
                Scroll size: ${model.scrollSize}px
            </div>
        </div>`;
    }
}

customElements.define("af-virtual-lit-list-extra-events", ExtraEvents);
