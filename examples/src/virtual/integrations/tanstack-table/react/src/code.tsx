import type { ListItemProps } from "@af-utils/virtual-react";
import {
    VirtualList,
    useVirtual,
    useVirtualItemRef
} from "@af-utils/virtual-react";
import {
    columnFilteringFeature,
    createColumnHelper,
    createFilteredRowModel,
    createSortedRowModel,
    filterFn_includesString,
    rowSortingFeature,
    sortFn_alphanumeric,
    sortFn_basic,
    tableFeatures,
    useTable,
    type ReactTable,
    type Row
} from "@tanstack/react-table";
import { memo, useState } from "react";
import css from "./style.module.css";

interface Person {
    age: number;
    id: string;
    name: string;
}

const ROW_COUNT = 10_000;
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
    table: ReactTable<typeof features, Person>;
}

const TableRow = memo<ListItemProps<ItemData>>(({ model, index, data }) => {
    const itemData = data as ItemData;
    const row = itemData.rows[index];
    if (!row) return null;

    return (
        <div
            ref={useVirtualItemRef(model, index)}
            className={css.row}
            data-row-id={row.id}
            role="row"
            aria-rowindex={index + 2}
        >
            {row.getAllCells().map(cell => (
                <div className={css.cell} role="cell" key={cell.id}>
                    <itemData.table.FlexRender cell={cell} />
                </div>
            ))}
        </div>
    );
});

const TanStackTable = () => {
    const [data] = useState<Person[]>(() =>
        Array.from({ length: ROW_COUNT }, (_, index) => ({
            age: 18 + ((index * 17) % 63),
            id: `P-${String(index).padStart(5, "0")}`,
            name: `Person ${String(ROW_COUNT - index - 1).padStart(5, "0")}`
        }))
    );
    const table = useTable({
        columns,
        data,
        features,
        getRowId: person => person.id
    });
    const rows = table.getRowModel().rows;
    const model = useVirtual({
        estimatedItemSize: 41,
        itemCount: rows.length
    });
    const nameColumn = table.getColumn("name");
    const filter = String(nameColumn?.getFilterValue() ?? "");

    return (
        <div className={css.example}>
            <div className={css.toolbar}>
                <label>
                    Filter names{" "}
                    <input
                        value={filter}
                        onChange={event =>
                            nameColumn?.setFilterValue(event.target.value)
                        }
                    />
                </label>
                <output className={css.status}>
                    {rows.length.toLocaleString()} rows
                </output>
            </div>
            <div
                className={css.table}
                role="table"
                aria-label="TanStack people table"
                aria-rowcount={rows.length + 1}
            >
                {table.getHeaderGroups().map(group => (
                    <div className={css.header} role="row" key={group.id}>
                        {group.headers.map(header => (
                            <div role="columnheader" key={header.id}>
                                <button
                                    type="button"
                                    aria-label={`Sort by ${String(header.column.columnDef.header)}`}
                                    onClick={header.column.getToggleSortingHandler()}
                                >
                                    <table.FlexRender header={header} />
                                    {header.column.getIsSorted() === "asc"
                                        ? " ↑"
                                        : ""}
                                    {header.column.getIsSorted() === "desc"
                                        ? " ↓"
                                        : ""}
                                </button>
                            </div>
                        ))}
                    </div>
                ))}
                <VirtualList
                    className={css.list}
                    model={model}
                    itemData={{ rows, table }}
                    getItemKey={index => rows[index]?.id ?? index}
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
