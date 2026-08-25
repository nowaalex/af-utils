<svelte:options runes={true} />

<script lang="ts">
    import { createVirtualList, virtualItem } from "@af-utils/virtual-svelte";
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
        tableFeatures
    } from "@tanstack/svelte-table";
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
    const table = createTable({
        columns,
        data,
        features,
        getRowId: (person) => person.id
    });
    const rows = $derived(table.getRowModel().rows);
    const { model, range, scroller, size, items } = createVirtualList(() => ({
        estimatedItemSize: 41,
        itemCount: rows.length
    }));
</script>

<div class={css.example}>
    <div class={css.toolbar}>
        <label>
            Filter names
            <input
                value={String(table.getColumn("name")?.getFilterValue() ?? "")}
                oninput={(event) =>
                    table
                        .getColumn("name")
                        ?.setFilterValue(event.currentTarget.value)}
            />
        </label>
        <output class={css.status}>{rows.length.toLocaleString()} rows</output>
    </div>
    <div
        class={css.table}
        role="table"
        aria-label="TanStack people table"
        aria-rowcount={rows.length + 1}
    >
        {#each table.getHeaderGroups() as group (group.id)}
            <div class={css.header} role="row">
                {#each group.headers as header (header.id)}
                    <div role="columnheader">
                        <button
                            type="button"
                            aria-label={`Sort by ${String(header.column.columnDef.header)}`}
                            onclick={header.column.getToggleSortingHandler()}
                        >
                            <FlexRender {header} />
                            {header.column.getIsSorted() === "asc" ? " ↑" : ""}
                            {header.column.getIsSorted() === "desc" ? " ↓" : ""}
                        </button>
                    </div>
                {/each}
            </div>
        {/each}
        <div
            class={css.list}
            {@attach scroller}
            role="rowgroup"
            aria-label="Virtual table rows"
        >
            <div {@attach size}>
                <div {@attach items}>
                    {#each range() as index (rows[index]?.id ?? index)}
                        {@const row = rows[index]}
                        {#if row}
                            <div
                                {@attach virtualItem(model, () => index)}
                                class={css.row}
                                data-row-id={row.id}
                                role="row"
                                aria-rowindex={index + 2}
                            >
                                {#each row.getAllCells() as cell (cell.id)}
                                    <div class={css.cell} role="cell">
                                        <FlexRender {cell} />
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>
