import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import { VirtualController, virtualItem } from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

export default class CustomRender extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private readonly _virtual = new VirtualController(this, () => ({
        itemCount: 50_000,
        estimatedItemSize: 50
    }));
    private _beforeElement: HTMLElement | null = null;
    private _afterElement: HTMLElement | null = null;
    private _scrollerElement: HTMLElement | null = null;
    private _unsubscribeRange: (() => void) | null = null;
    private _unsubscribeSpacers: (() => void) | null = null;
    /** Apply the latest model geometry without waiting for a host render. */
    private readonly _updateSpacers = () => {
        const beforeSize = this._virtual.model.renderedRangeOffset;
        const rangeSize = this._virtual.model.renderedRangeSize;

        if (this._beforeElement) {
            this._beforeElement.style.height = `${beforeSize}px`;
        }
        if (this._afterElement) {
            this._afterElement.style.height = `${Math.max(
                0,
                this._virtual.model.scrollSize - beforeSize - rangeSize
            )}px`;
        }
    };
    /** Track the spacer before the rendered range. */
    private readonly _beforeRef = (element?: Element) => {
        this._beforeElement = (element as HTMLElement | undefined) ?? null;
        this._updateSpacers();
    };
    /** Track the spacer after the rendered range. */
    private readonly _afterRef = (element?: Element) => {
        this._afterElement = (element as HTMLElement | undefined) ?? null;
        this._updateSpacers();
    };
    private readonly _scrollerRef = (element?: Element) => {
        this._scrollerElement = (element as HTMLElement | undefined) ?? null;
        this._virtual.model.setScroller(this._scrollerElement);
    };
    private readonly _headerRef = (element?: Element) =>
        this._virtual.model.setStickyHeader(
            (element as HTMLElement | undefined) ?? null
        );
    private readonly _containerRef = (element?: Element) =>
        this._virtual.model.setContainer(
            (element as HTMLElement | undefined) ?? null
        );
    private readonly _footerRef = (element?: Element) =>
        this._virtual.model.setStickyFooter(
            (element as HTMLElement | undefined) ?? null
        );
    /** Apply native wheel deltas on the main thread before the next paint. */
    private readonly _handleWheel = (event: WheelEvent) => {
        const scroller = this._scrollerElement;
        if (!scroller || event.ctrlKey || event.deltaY === 0) return;

        event.preventDefault();
        const unit =
            event.deltaMode === WheelEvent.DOM_DELTA_LINE
                ? Number.parseFloat(getComputedStyle(scroller).lineHeight) || 16
                : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
                  ? scroller.clientHeight
                  : 1;
        scroller.scrollTop += event.deltaY * unit;
    };

    connectedCallback() {
        super.connectedCallback();
        this.style.cssText = "display:grid;width:100%;height:100%";
        this._unsubscribeRange ??= this._virtual.model.subscribe(() => {
            this.requestUpdate();
            // A large native wheel delta can move the old table rows out of
            // the viewport before Lit's scheduled microtask commit. Commit
            // the replacement range in the scroll event to avoid a painted
            // empty frame.
            this.performUpdate();
        }, VirtualScrollerEvent.RANGE);
        this._unsubscribeSpacers ??= this._virtual.model.subscribe(
            this._updateSpacers,
            VirtualScrollerEvent.SCROLL_SIZE | VirtualScrollerEvent.SIZES
        );
    }

    /** Stop imperative geometry updates while the host is detached. */
    disconnectedCallback() {
        this._unsubscribeRange?.();
        this._unsubscribeRange = null;
        this._unsubscribeSpacers?.();
        this._unsubscribeSpacers = null;
        super.disconnectedCallback();
    }

    /** Commit spacer geometry together with the newly rendered range. */
    protected updated() {
        this._updateSpacers();
    }

    protected render() {
        const model = this._virtual.model;
        return html`<div
            ${ref(this._scrollerRef)}
            class=${css.wrapper}
            @wheel=${this._handleWheel}
        >
            <table class=${css.table}>
                <thead ${ref(this._headerRef)} class=${css.thead}>
                    <tr>
                        <th scope="col">Column one</th>
                        <th scope="col">Column two</th>
                    </tr>
                </thead>
                <tbody ${ref(this._containerRef)}>
                    <tr aria-hidden="true">
                        <td class=${css.spacerCell} colspan="2">
                            <div
                                ${ref(this._beforeRef)}
                                class=${css.spacer}
                            ></div>
                        </td>
                    </tr>
                    ${mapVirtualRange(
                        model,
                        index => html`<tr ${virtualItem(model, index)}>
                            <td>Cell one - ${index}</td>
                            <td>
                                Cell two - ${index}
                                ${
                                    index % 3 === 1
                                        ? html`<span>Additional content</span>`
                                        : null
                                }
                                ${
                                    index % 3 === 2
                                        ? html`<span>Additional content</span
                                              ><span>One more line</span>`
                                        : null
                                }
                            </td>
                        </tr>`
                    )}
                    <tr aria-hidden="true">
                        <td class=${css.spacerCell} colspan="2">
                            <div
                                ${ref(this._afterRef)}
                                class=${css.spacer}
                            ></div>
                        </td>
                    </tr>
                </tbody>
                <tfoot ${ref(this._footerRef)} class=${css.tfoot}>
                    <tr>
                        <td>Row one</td>
                        <td>Row two</td>
                    </tr>
                </tfoot>
            </table>
        </div>`;
    }
}

customElements.define("af-virtual-lit-primitives-custom-render", CustomRender);
