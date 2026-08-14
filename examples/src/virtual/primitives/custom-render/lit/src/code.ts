import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    VirtualController,
    VirtualSnapshotController,
    virtualItem
} from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import { repeat } from "lit/directives/repeat.js";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

export default class CustomRender extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private readonly virtual = new VirtualController(this, () => ({
        itemCount: 50_000,
        estimatedItemSize: 50
    }));
    private readonly snapshot = new VirtualSnapshotController(
        this,
        this.virtual.model,
        VirtualScrollerEvent.RANGE
    );
    private beforeElement: HTMLElement | null = null;
    private afterElement: HTMLElement | null = null;
    private unsubscribeSpacers: (() => void) | null = null;
    /** Apply the latest model geometry without waiting for a host render. */
    private readonly updateSpacers = () => {
        const beforeSize = this.virtual.model.renderedRangeOffset;
        const rangeSize = this.virtual.model.renderedRangeSize;

        if (this.beforeElement) {
            this.beforeElement.style.height = `${beforeSize}px`;
        }
        if (this.afterElement) {
            this.afterElement.style.height = `${Math.max(
                0,
                this.virtual.model.scrollSize - beforeSize - rangeSize
            )}px`;
        }
    };
    /** Track the spacer before the rendered range. */
    private readonly beforeRef = (element?: Element) => {
        this.beforeElement = (element as HTMLElement | undefined) ?? null;
        this.updateSpacers();
    };
    /** Track the spacer after the rendered range. */
    private readonly afterRef = (element?: Element) => {
        this.afterElement = (element as HTMLElement | undefined) ?? null;
        this.updateSpacers();
    };
    private readonly scrollerRef = (element?: Element) =>
        this.virtual.model.setScroller(
            (element as HTMLElement | undefined) ?? null
        );
    private readonly headerRef = (element?: Element) =>
        this.virtual.model.setStickyHeader(
            (element as HTMLElement | undefined) ?? null
        );
    private readonly containerRef = (element?: Element) =>
        this.virtual.model.setContainer(
            (element as HTMLElement | undefined) ?? null
        );
    private readonly footerRef = (element?: Element) =>
        this.virtual.model.setStickyFooter(
            (element as HTMLElement | undefined) ?? null
        );
    connectedCallback() {
        super.connectedCallback();
        this.style.cssText = "display:grid;width:100%;height:100%";
        this.unsubscribeSpacers ??= this.virtual.model.subscribe(
            this.updateSpacers,
            VirtualScrollerEvent.RANGE |
                VirtualScrollerEvent.SCROLL_SIZE |
                VirtualScrollerEvent.SIZES
        );
    }

    /** Stop imperative geometry updates while the host is detached. */
    disconnectedCallback() {
        this.unsubscribeSpacers?.();
        this.unsubscribeSpacers = null;
        super.disconnectedCallback();
    }

    protected render() {
        const model = this.virtual.model;
        return html`<div ${ref(this.scrollerRef)} class=${css.wrapper}>
            <table class=${css.table}>
                <thead ${ref(this.headerRef)} class=${css.thead}>
                    <tr>
                        <th scope="col">Column one</th>
                        <th scope="col">Column two</th>
                    </tr>
                </thead>
                <tbody ${ref(this.containerRef)}>
                    <tr aria-hidden="true">
                        <td class=${css.spacerCell} colspan="2">
                            <div
                                ${ref(this.beforeRef)}
                                class=${css.spacer}
                            ></div>
                        </td>
                    </tr>
                    ${repeat(
                        mapVirtualRange(model, index => index),
                        index => index,
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
                                ${ref(this.afterRef)}
                                class=${css.spacer}
                            ></div>
                        </td>
                    </tr>
                </tbody>
                <tfoot ${ref(this.footerRef)} class=${css.tfoot}>
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
