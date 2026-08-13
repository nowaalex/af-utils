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

    private _sizes = Array.from(
        { length: DEFAULT_ROW_COUNT },
        (_, index) => 20 + ((index ** 2) & 31)
    );
    private readonly _virtual = new VirtualController(this, () => ({
        itemCount: this._sizes.length,
        estimatedItemSize: 78
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
        this._virtual.model.scrollToIndex(this._sizes.length - 1);
    }

    private _scrollFromForm(event: SubmitEvent) {
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
            this._virtual.model.scrollToIndex(index, true);
        }
    }

    private _changeRows(event: SubmitEvent) {
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
            this._sizes =
                rowsToAdd > 0
                    ? this._sizes.concat(
                          Array.from(
                              { length: rowsToAdd },
                              (_, index) => 50 + ((index ** 2) & 63)
                          )
                      )
                    : this._sizes.slice(0, rowsToAdd);
            this.requestUpdate();
            void this.updateComplete.then(() =>
                this._virtual.model.scrollToIndex(this._sizes.length - 1)
            );
        } else {
            this._virtual.model.scrollToIndex(this._sizes.length - 1);
        }
    }

    protected render() {
        const model = this._virtual.model;
        return html`<div
            ${this._layout.scrollerRef}
            data-layout
            style="width:100%;height:100%"
            class=${css.list}
            role="list"
        >
            <form
                ${ref(this._headerRef)}
                class=${`${css.form} ${css.top0}`}
                @submit=${this._scrollFromForm}
            >
                <label
                    >Smooth scroll to index:&nbsp;<input
                        required
                        value=${Math.round(this._sizes.length / 2)}
                        name="index"
                        class=${css.inp}
                        type="number"
                /></label>
                <button class=${css.btn} type="submit">Go</button>
            </form>
            <div ${this._layout.sizeRef} data-layout>
                <div ${this._layout.itemsRef} data-layout>
                    ${mapVirtualRange(
                        model,
                        index => html`<div
                            ${virtualItem(model, index)}
                            class=${css.item}
                            role="listitem"
                            aria-posinset=${index + 1}
                            aria-setsize=${this._sizes.length}
                            style=${`padding:${this._sizes[index]}px 0.7em`}
                        >
                            row ${index}:&nbsp;${this._sizes[index]}px
                        </div>`
                    )}
                </div>
            </div>
            <form
                ${ref(this._footerRef)}
                class=${`${css.form} ${css.bottom0}`}
                @submit=${this._changeRows}
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
