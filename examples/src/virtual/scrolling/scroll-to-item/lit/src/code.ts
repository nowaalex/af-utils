import {
    VirtualController,
    virtualRange,
    virtualItem
} from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import Footer from "./Footer";
import Header from "./Header";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

const DEFAULT_ROW_COUNT = 50_000;
const MAX_ROW_COUNT = 100_000;

export default class ScrollToItem extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private sizes = Array.from(
        { length: DEFAULT_ROW_COUNT },
        (_, index) => 20 + ((index ** 2) & 31)
    );
    private readonly virtual = new VirtualController(this, () => ({
        itemCount: this.sizes.length,
        estimatedItemSize: 78
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

    protected firstUpdated() {
        this.virtual.model.scrollToIndex(this.sizes.length - 1);
    }

    private changeRows(rowsToAdd: number) {
        if (rowsToAdd !== 0) {
            this.sizes =
                rowsToAdd > 0
                    ? this.sizes.concat(
                          Array.from(
                              { length: rowsToAdd },
                              (_, index) => 50 + ((index ** 2) & 63)
                          )
                      )
                    : this.sizes.slice(0, rowsToAdd);
            this.requestUpdate();
            void this.updateComplete.then(() =>
                this.virtual.model.scrollToIndex(this.sizes.length - 1)
            );
        } else {
            this.virtual.model.scrollToIndex(this.sizes.length - 1);
        }
    }

    protected render() {
        const model = this.virtual.model;
        return html`<div
            ${ref(this.virtual.scrollerRef)}
            style="width:100%;height:100%"
            class=${css.list}
            role="list"
            tabindex="-1"
        >
            ${Header({
                elementRef: this.headerRef,
                initialIndex: Math.round(this.sizes.length / 2),
                maxIndex: this.sizes.length - 1,
                onScroll: index =>
                    model.scrollToIndex(index, { behavior: "smooth" })
            })}
            <div ${ref(this.virtual.sizeRef)}>
                <div ${ref(this.virtual.itemsRef)}>
                    ${virtualRange(
                        model,
                        index => html`<div
                            ${virtualItem(model, index)}
                            class=${css.item}
                            role="listitem"
                            aria-posinset=${index + 1}
                            aria-setsize=${this.sizes.length}
                            style=${`padding:${this.sizes[index]}px 0.7em`}
                        >
                            row ${index}:&nbsp;${this.sizes[index]}px
                        </div>`
                    )}
                </div>
            </div>
            ${Footer({
                elementRef: this.footerRef,
                minRowsToAdd: 1 - this.sizes.length,
                maxRowsToAdd: MAX_ROW_COUNT - this.sizes.length,
                onChangeRows: rowsToAdd => this.changeRows(rowsToAdd)
            })}
        </div>`;
    }
}

customElements.define("af-virtual-lit-scrolling-scroll-to-item", ScrollToItem);
