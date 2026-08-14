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
    private readonly snapshot = new VirtualSnapshotController(
        this,
        this.virtual.model,
        VirtualScrollerEvent.RANGE
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
        this.virtual.model.scrollToIndex(this.sizes.length - 1);
    }

    private scrollFromForm(event: SubmitEvent) {
        event.preventDefault();
        const index = Number.parseInt(
            String(
                new FormData(event.currentTarget as HTMLFormElement).get(
                    "index"
                ) ?? ""
            ),
            10
        );
        if (!Number.isNaN(index)) {
            this.virtual.model.scrollToIndex(index, true);
        }
    }

    private changeRows(event: SubmitEvent) {
        event.preventDefault();
        const rowsToAdd = Number.parseInt(
            String(
                new FormData(event.currentTarget as HTMLFormElement).get(
                    "rowsToAdd"
                ) ?? ""
            ),
            10
        );
        if (!Number.isNaN(rowsToAdd) && rowsToAdd !== 0) {
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
            ${ref(this.layout.scrollerRef)}
            data-layout
            style="width:100%;height:100%"
            class=${css.list}
            role="list"
            tabindex="-1"
        >
            <form
                ${ref(this.headerRef)}
                class=${`${css.form} ${css.top0}`}
                @submit=${this.scrollFromForm}
            >
                <label
                    >Smooth scroll to index:&nbsp;<input
                        required
                        value=${Math.round(this.sizes.length / 2)}
                        name="index"
                        class=${css.inp}
                        type="number"
                /></label>
                <button class=${css.btn} type="submit">Go</button>
            </form>
            <div ${ref(this.layout.sizeRef)} data-layout>
                <div ${ref(this.layout.itemsRef)} data-layout>
                    ${mapVirtualRange(
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
            <form
                ${ref(this.footerRef)}
                class=${`${css.form} ${css.bottom0}`}
                @submit=${this.changeRows}
            >
                <label
                    >Rows to add:&nbsp;<input
                        value="0"
                        type="number"
                        required
                        name="rowsToAdd"
                        class=${css.inp}
                /></label>
                <button class=${css.btn} type="submit">
                    Add and scroll to end
                </button>
            </form>
        </div>`;
    }
}

customElements.define("af-virtual-lit-list-scroll-to-item", ScrollToItem);
