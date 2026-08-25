import {
    createVirtual,
    createVirtualItemRef,
    VirtualList,
    type ListItemProps
} from "@af-utils/virtual-solid";
import {
    columnFilteringFeature,
    createColumnHelper,
    createFilteredRowModel,
    createSortedRowModel,
    createTable,
    filterFn_includesString,
    FlexRender,
    rowSortingFeature,
    sortFn_alphanumeric,
    sortFn_basic,
    tableFeatures,
    type Row
} from "@tanstack/solid-table";
import { For } from "solid-js";
import css from "./style.module.css";

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

type PersonRow = Row<typeof features, Person>;
interface ItemData {
    rows: PersonRow[];
}

const TableRow = (props: ListItemProps<ItemData>) => {
    const row = () => props.data?.rows[props.index()];

    return (
        <div
            ref={createVirtualItemRef(props.model, props.index)}
            class={css.row}
            data-row-id={row()?.id}
            role="row"
            aria-rowindex={props.index() + 2}
        >
            <For each={row()?.getAllCells()}>
                {cell => (
                    <div class={css.cell} role="cell">
                        <FlexRender cell={cell} />
                    </div>
                )}
            </For>
        </div>
    );
};

const TanStackTable = () => {
    const table = createTable({
        columns,
        data,
        features,
        getRowId: person => person.id
    });
    const rows = () => table.getRowModel().rows;
    const model = createVirtual(() => ({
        estimatedItemSize: 41,
        itemCount: rows().length
    }));

    return (
        <div class={css.example}>
            <div class={css.toolbar}>
                <label>
                    Filter names{" "}
                    <input
                        value={String(
                            table.getColumn("name")?.getFilterValue() ?? ""
                        )}
                        onInput={event =>
                            table
                                .getColumn("name")
                                ?.setFilterValue(event.currentTarget.value)
                        }
                    />
                </label>
                <output class={css.status}>
                    {rows().length.toLocaleString()} rows
                </output>
            </div>
            <div
                class={css.table}
                role="table"
                aria-label="TanStack people table"
                aria-rowcount={rows().length + 1}
            >
                <For each={table.getHeaderGroups()}>
                    {group => (
                        <div class={css.header} role="row">
                            <For each={group.headers}>
                                {header => (
                                    <div role="columnheader">
                                        <button
                                            type="button"
                                            aria-label={`Sort by ${String(header.column.columnDef.header)}`}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <table.FlexRender header={header} />
                                            {header.column.getIsSorted() ===
                                            "asc"
                                                ? " ↑"
                                                : ""}
                                            {header.column.getIsSorted() ===
                                            "desc"
                                                ? " ↓"
                                                : ""}
                                        </button>
                                    </div>
                                )}
                            </For>
                        </div>
                    )}
                </For>
                <VirtualList
                    class={css.list}
                    model={model}
                    itemData={{ rows: rows() }}
                    getItemKey={index => rows()[index]?.id ?? index}
                    role="rowgroup"
                    aria-label="Virtual table rows"
                >
                    {TableRow}
                </VirtualList>
            </div>
        </div>
    );
};

export default TanStackTable;
