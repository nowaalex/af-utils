import {
    VirtualController,
    virtualRange,
    virtualItem
} from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

export default class StickyHeaderAndFooter extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private readonly virtual = new VirtualController(this, () => ({
        itemCount: 200_000
    }));
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

    protected render() {
        const model = this.virtual.model;
        return html`<div
            ${ref(this.virtual.scrollerRef)}
            style="width:100%;height:100%"
            role="list"
            aria-label="Sticky header and footer list"
        >
            <div
                ${ref(this.headerRef)}
                class=${css.header}
                data-testid="sticky-header"
            >
                Header
            </div>
            <div ${ref(this.virtual.sizeRef)}>
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
            <div
                ${ref(this.footerRef)}
                class=${css.footer}
                data-testid="sticky-footer"
            >
                Footer
            </div>
        </div>`;
    }
}

customElements.define(
    "af-virtual-lit-basics-sticky-header-and-footer",
    StickyHeaderAndFooter
);
