import {
    VirtualController,
    virtualItem,
    virtualRange
} from "@af-utils/virtual-lit";
import {
    columnFilteringFeature,
    createColumnHelper,
    createFilteredRowModel,
    createSortedRowModel,
    filterFn_includesString,
    rowSortingFeature,
    sortFn_alphanumeric,
    sortFn_basic,
    TableController,
    tableFeatures
} from "@tanstack/lit-table";
import { html, LitElement, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

interface Person {
    age: number;
    id: string;
    name: string;
}

const ROW_COUNT = 10_000;
const data: Person[] = Array.from({ length: ROW_COUNT }, (_, index) => ({
    age: 18 + ((index * 17) % 63),
    id: `P-${String(index).padStart(5, "0")}`,
    name: `Person ${String(ROW_COUNT - index - 1).padStart(5, "0")}`
}));
const features = tableFeatures({
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

export default class TanStackTable extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private rowCount = ROW_COUNT;
    private rows: { id: string }[] = data;
    private readonly virtual = new VirtualController(this, () => ({
        estimatedItemSize: 41,
        itemCount: this.rowCount
    }));
    private readonly tableController = new TableController<
        typeof features,
        Person
    >(this);

    connectedCallback() {
        super.connectedCallback();
        this.style.cssText = "display:block;width:100%;height:100%";
    }

    protected render() {
        const table = this.tableController.table(
            {
                columns,
                data,
                features,
                getRowId: person => person.id
            },
            state => ({
                columnFilters: state.columnFilters,
                sorting: state.sorting
            })
        );
        const rows = table.getRowModel().rows;
        this.rows = rows;
        this.rowCount = rows.length;
        const model = this.virtual.model;
        const nameColumn = table.getColumn("name");

        return html`<div class=${css.example}>
            <div class=${css.toolbar}>
                <label>
                    Filter names
                    <input
                        .value=${String(nameColumn?.getFilterValue() ?? "")}
                        @input=${(event: Event) =>
                            nameColumn?.setFilterValue(
                                (event.currentTarget as HTMLInputElement).value
                            )}
                    />
                </label>
                <output class=${css.status}
                    >${rows.length.toLocaleString()} rows</output
                >
            </div>
            <div
                class=${css.table}
                role="table"
                aria-label="TanStack people table"
                aria-rowcount=${rows.length + 1}
            >
                ${table.getHeaderGroups().map(
                    group => html`<div class=${css.header} role="row">
                        ${group.headers.map(
                            header => html`<div role="columnheader">
                                <button
                                    type="button"
                                    aria-label=${`Sort by ${String(header.column.columnDef.header)}`}
                                    @click=${header.column.getToggleSortingHandler()}
                                >
                                    ${table.FlexRender({ header })}
                                    ${
                                        header.column.getIsSorted() === "asc"
                                            ? " ↑"
                                            : ""
                                    }${
                                        header.column.getIsSorted() === "desc"
                                            ? " ↓"
                                            : ""
                                    }
                                </button>
                            </div>`
                        )}
                    </div>`
                )}
                <div
                    ${ref(this.virtual.scrollerRef)}
                    class=${css.list}
                    role="rowgroup"
                    aria-label="Virtual table rows"
                >
                    <div ${ref(this.virtual.sizeRef)}>
                        <div ${ref(this.virtual.itemsRef)}>
                            ${virtualRange(
                                model,
                                index => {
                                    const row = rows[index];
                                    if (!row) return;
                                    return html`<div
                                        ${virtualItem(model, index)}
                                        class=${css.row}
                                        data-row-id=${row.id}
                                        role="row"
                                        aria-rowindex=${index + 2}
                                    >
                                        ${row
                                            .getAllCells()
                                            .map(
                                                cell => html`<div
                                                    class=${css.cell}
                                                    role="cell"
                                                >
                                                    ${table.FlexRender({ cell })}
                                                </div>`
                                            )}
                                    </div>`;
                                },
                                index => rows[index]?.id ?? index
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }
}

customElements.define("af-virtual-lit-tanstack-table", TanStackTable);
