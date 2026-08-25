import {
    mapVirtualRange,
    VirtualScroller,
    VirtualScrollerEvent,
    VirtualScrollerLayout
} from "@af-utils/virtual-core";
import {
    columnFilteringFeature,
    constructTable,
    createColumnHelper,
    createFilteredRowModel,
    createSortedRowModel,
    filterFn_includesString,
    rowSortingFeature,
    sortFn_alphanumeric,
    sortFn_basic,
    tableFeatures
} from "@tanstack/table-core";
import { storeReactivityBindings } from "@tanstack/table-core/store-reactivity-bindings";
import css from "./style.module.css";

interface Person {
    age: number;
    id: string;
    name: string;
}

const ROW_COUNT = 10_000;
const EXAMPLE_ELEMENT_TAG = "virtual-core-example";
const data: Person[] = Array.from({ length: ROW_COUNT }, (_, index) => ({
    age: 18 + ((index * 17) % 63),
    id: `P-${String(index).padStart(5, "0")}`,
    name: `Person ${String(ROW_COUNT - index - 1).padStart(5, "0")}`
}));
const features = tableFeatures({
    coreReactivityFeature: storeReactivityBindings(),
    columnFilteringFeature,
    rowSortingFeature,
    filteredRowModel: createFilteredRowModel(),
    sortedRowModel: createSortedRowModel(),
    filterFns: { includesString: filterFn_includesString },
    sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic }
});
const columnHelper = createColumnHelper<typeof features, Person>();
const columns = columnHelper.columns([
    columnHelper.accessor("id", {
        header: "ID",
        sortDescFirst: false,
        sortFn: "alphanumeric"
    }),
    columnHelper.accessor("name", {
        filterFn: "includesString",
        header: "Name",
        sortDescFirst: false,
        sortFn: "alphanumeric"
    }),
    columnHelper.accessor("age", {
        header: "Age",
        sortDescFirst: false,
        sortFn: "basic"
    })
]);

class VirtualCoreExample extends HTMLElement {
    private readonly table = constructTable({
        columns,
        data,
        features,
        getRowId: person => person.id
    });
    private readonly model = new VirtualScroller({
        estimatedItemSize: 41,
        itemCount: ROW_COUNT
    });
    private readonly layout = new VirtualScrollerLayout(this.model);
    private readonly itemElements = new Map<string | number, HTMLElement>();
    private readonly renderedItems = new Set<HTMLElement>();
    private unsubscribe: (() => void) | undefined;

    connectedCallback() {
        this.innerHTML = `<div class="${css.example}">
            <div class="${css.toolbar}">
                <label>Filter names <input></label>
                <output class="${css.status}">${ROW_COUNT.toLocaleString()} rows</output>
            </div>
            <div class="${css.table}" role="table" aria-label="TanStack people table" aria-rowcount="${ROW_COUNT + 1}">
                <div class="${css.header}" role="row" data-header></div>
                <div class="${css.list}" role="rowgroup" aria-label="Virtual table rows">
                    <div data-size><div data-items></div></div>
                </div>
            </div>
        </div>`;

        const input = this.querySelector<HTMLInputElement>("input");
        const output = this.querySelector<HTMLOutputElement>("output");
        const tableElement = this.querySelector<HTMLElement>('[role="table"]');
        const headerElement = this.querySelector<HTMLElement>("[data-header]");
        const list = this.querySelector<HTMLElement>('[role="rowgroup"]');
        const size = this.querySelector<HTMLElement>("[data-size]");
        const items = this.querySelector<HTMLElement>("[data-items]");
        if (
            !input ||
            !output ||
            !tableElement ||
            !headerElement ||
            !list ||
            !size ||
            !items
        ) {
            throw new Error("TanStack table example markup is incomplete");
        }

        const renderRange = () => {
            const rows = this.table.getRowModel().rows;
            for (const item of this.renderedItems) this.model.detachItem(item);
            this.renderedItems.clear();
            const nextKeys = new Set<string | number>();
            const elements = mapVirtualRange(this.model, index => {
                const row = rows[index];
                const key = row.id;
                nextKeys.add(key);
                const element =
                    this.itemElements.get(key) ?? document.createElement("div");
                this.itemElements.set(key, element);
                element.className = css.row;
                element.role = "row";
                element.setAttribute("aria-rowindex", String(index + 2));
                element.dataset.rowId = row.id;
                element.replaceChildren();
                for (const cell of row.getAllCells()) {
                    const cellElement = document.createElement("div");
                    cellElement.className = css.cell;
                    cellElement.role = "cell";
                    cellElement.textContent = String(cell.getValue());
                    element.append(cellElement);
                }
                this.model.attachItem(element, index);
                this.renderedItems.add(element);
                return element;
            });
            for (const key of this.itemElements.keys()) {
                if (!nextKeys.has(key)) this.itemElements.delete(key);
            }
            items.replaceChildren(...elements);
        };
        const renderHeader = () => {
            const group = this.table.getHeaderGroups()[0];
            headerElement.replaceChildren(
                ...group.headers.map(header => {
                    const columnHeader = document.createElement("div");
                    columnHeader.role = "columnheader";
                    const button = document.createElement("button");
                    const label = String(header.column.columnDef.header);
                    button.type = "button";
                    button.ariaLabel = `Sort by ${label}`;
                    button.textContent = `${label}${
                        header.column.getIsSorted() === "asc" ? " ↑" : ""
                    }${header.column.getIsSorted() === "desc" ? " ↓" : ""}`;
                    button.addEventListener("click", () => {
                        header.column.toggleSorting();
                        renderState();
                    });
                    columnHeader.append(button);
                    return columnHeader;
                })
            );
        };
        const renderState = () => {
            const rowCount = this.table.getRowModel().rows.length;
            this.model.setItemCount(rowCount);
            output.value = `${rowCount.toLocaleString()} rows`;
            tableElement.ariaRowCount = String(rowCount + 1);
            renderHeader();
            renderRange();
        };

        this.layout.setScrollerElement(list);
        this.layout.setSizeElement(size);
        this.layout.setItemsElement(items);
        this.unsubscribe = this.model.subscribe(
            renderRange,
            VirtualScrollerEvent.RANGE
        );
        input.addEventListener("input", () => {
            this.table.getColumn("name")?.setFilterValue(input.value);
            renderState();
        });
        renderState();
        this.dataset.exampleReady = "";
    }

    disconnectedCallback() {
        this.unsubscribe?.();
        this.layout.dispose();
        this.model.dispose();
    }
}

if (!customElements.get(EXAMPLE_ELEMENT_TAG)) {
    customElements.define(EXAMPLE_ELEMENT_TAG, VirtualCoreExample);
}
