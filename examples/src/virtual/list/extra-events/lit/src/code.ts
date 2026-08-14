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

export default class ExtraEvents extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private readonly virtual = new VirtualController(this, () => ({
        itemCount: 150_000,
        estimatedItemSize: 35
    }));
    private readonly rangeSnapshot = new VirtualSnapshotController(
        this,
        this.virtual.model,
        VirtualScrollerEvent.RANGE
    );
    private readonly scrollSizeSnapshot = new VirtualSnapshotController(
        this,
        this.virtual.model,
        VirtualScrollerEvent.SCROLL_SIZE
    );
    private readonly layout = new VirtualLayoutController(
        this,
        this.virtual.model
    );
    private readonly headerRef = (element?: Element) =>
        this.virtual.model.setStickyHeader(
            (element as HTMLElement | undefined) ?? null
        );
    private readonly footerRef = (element?: Element) =>
        this.virtual.model.setStickyFooter(
            (element as HTMLElement | undefined) ?? null
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
            role="list"
            aria-label="Extra events list"
        >
            <div ${ref(this.headerRef)} class=${`${css.row} ${css.top0}`}>
                Rendered ${model.to - model.from} items. Range: ${model.from} -
                ${model.to}
            </div>
            <div ${ref(this.layout.sizeRef)} data-layout>
                <div ${ref(this.layout.itemsRef)} data-layout>
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
            <div ${ref(this.footerRef)} class=${`${css.row} ${css.bottom0}`}>
                Scroll size: ${model.scrollSize}px
            </div>
        </div>`;
    }
}

customElements.define("af-virtual-lit-list-extra-events", ExtraEvents);
