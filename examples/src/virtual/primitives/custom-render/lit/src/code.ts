import { mapVirtualRange, VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    VirtualController,
    VirtualSnapshotController,
    virtualItem
} from "@af-utils/virtual-lit";
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
    private readonly _snapshot = new VirtualSnapshotController(
        this,
        this._virtual.model,
        VirtualScrollerEvent.ALL
    );
    private readonly _scrollerRef = (element?: Element) =>
        this._virtual.model.setScroller(
            (element as HTMLElement | undefined) ?? null
        );
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

    connectedCallback() {
        super.connectedCallback();
        this.style.cssText = "display:grid;width:100%;height:100%";
    }

    protected render() {
        const model = this._virtual.model;
        const beforeSize = model.renderedRangeOffset;
        const afterSize = Math.max(
            0,
            model.scrollSize - beforeSize - model.renderedRangeSize
        );
        return html`<div ${ref(this._scrollerRef)} class=${css.wrapper}>
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
                                class=${css.spacer}
                                style=${`height:${beforeSize}px`}
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
                                class=${css.spacer}
                                style=${`height:${afterSize}px`}
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
