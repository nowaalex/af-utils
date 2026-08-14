import {
    mapVirtualRangeWithOffset,
    type VirtualScroller,
    VirtualScrollerEvent
} from "@af-utils/virtual-core";
import {
    VirtualController,
    VirtualSnapshotController,
    virtualGridItem
} from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

const SIZE = 50_000;

const scrollModelTo = (model: VirtualScroller, value: string) => {
    const index = Number.parseInt(value, 10);
    if (!Number.isNaN(index)) model.scrollToIndex(index, true);
};

export default class Grid extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private readonly rows = new VirtualController(this, () => ({
        itemCount: SIZE,
        estimatedItemSize: 120,
        overscanCount: 2
    }));
    private readonly columns = new VirtualController(this, () => ({
        itemCount: SIZE,
        estimatedItemSize: 200,
        overscanCount: 2,
        horizontal: true
    }));
    private readonly rowSnapshot = new VirtualSnapshotController(
        this,
        this.rows.model,
        VirtualScrollerEvent.ALL
    );
    private readonly columnSnapshot = new VirtualSnapshotController(
        this,
        this.columns.model,
        VirtualScrollerEvent.ALL
    );
    private readonly scrollerRef = (element?: Element) => {
        const scroller = (element as HTMLElement | undefined) ?? null;
        this.rows.model.setScroller(scroller);
        this.columns.model.setScroller(scroller);
    };

    connectedCallback() {
        super.connectedCallback();
        this.style.cssText = "display:grid;width:100%;height:100%";
    }

    private scrollFromForm(event: SubmitEvent) {
        event.preventDefault();
        const form = new FormData(event.currentTarget as HTMLFormElement);
        scrollModelTo(
            form.get("type") === "row" ? this.rows.model : this.columns.model,
            String(form.get("index") ?? "")
        );
    }

    protected render() {
        const rows = this.rows.model;
        const columns = this.columns.model;
        const cells = mapVirtualRangeWithOffset(rows, (row, rowOffset) =>
            mapVirtualRangeWithOffset(columns, (column, columnOffset) => ({
                column,
                columnOffset,
                row,
                rowOffset
            }))
        ).flat();

        return html`<div class=${css.root}>
            <form class=${css.form} @submit=${this.scrollFromForm}>
                <select name="type">
                    <option value="row">Row</option>
                    <option value="col">Col</option>
                </select>
                <input
                    placeholder="index"
                    type="number"
                    name="index"
                    min="0"
                    max=${SIZE - 1}
                    class="w-28"
                />
                <button type="submit" class=${css.btn}>Scroll</button>
            </form>
            <div
                ${ref(this.scrollerRef)}
                class=${css.grid}
                data-testid="virtual-grid"
            >
                <div
                    class=${css.gridItems}
                    style=${`height:${rows.scrollSize}px;width:${columns.scrollSize}px`}
                >
                    ${cells.map(
                        cell => html`<div
                            ${virtualGridItem(
                                rows,
                                cell.row,
                                columns,
                                cell.column
                            )}
                            class=${css.cell}
                            data-row-index=${cell.row}
                            data-column-index=${cell.column}
                            style=${`width:${Math.max(cell.column ** 2 % 256, 190)}px;padding:${Math.max(cell.row ** 2 % 64, 30)}px 0;transform:translateX(${cell.columnOffset}px) translateY(${cell.rowOffset}px)`}
                        >
                            <div class=${css.cellContent}>
                                <span>row:</span
                                >${cell.row}<span>col:</span>${cell.column}
                            </div>
                        </div>`
                    )}
                </div>
            </div>
        </div>`;
    }
}

customElements.define("af-virtual-lit-primitives-grid", Grid);
