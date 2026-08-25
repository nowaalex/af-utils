<script setup lang="ts">
import {
    useVirtual,
    virtualItemDirective as vVirtualItem,
    VirtualList
} from "@af-utils/virtual-vue";
import {
    columnFilteringFeature,
    createColumnHelper,
    createFilteredRowModel,
    createSortedRowModel,
    filterFn_includesString,
    FlexRender,
    rowSortingFeature,
    sortFn_alphanumeric,
    sortFn_basic,
    tableFeatures,
    useTable
} from "@tanstack/vue-table";
import { computed, ref } from "vue";
import css from "./style.module.css";

interface Person {
    age: number;
    id: string;
    name: string;
}

const ROW_COUNT = 10_000;
const data = ref<Person[]>(
    Array.from({ length: ROW_COUNT }, (_, index) => ({
        age: 18 + ((index * 17) % 63),
        id: `P-${String(index).padStart(5, "0")}`,
        name: `Person ${String(ROW_COUNT - index - 1).padStart(5, "0")}`
    }))
);
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
const table = useTable({
    columns,
    data,
    features,
    getRowId: (person: Person) => person.id
});
const rows = computed(() => table.getRowModel().rows);
const model = useVirtual(() => ({
    estimatedItemSize: 41,
    itemCount: rows.value.length
}));
const getItemKey = (index: number) => rows.value[index]?.id ?? index;
const nameColumn = computed(() => table.getColumn("name"));
const updateFilter = (event: Event) =>
    nameColumn.value?.setFilterValue(
        (event.currentTarget as HTMLInputElement).value
    );
</script>

<template>
    <div :class="css.example">
        <div :class="css.toolbar">
            <label>
                Filter names
                <input
                    :value="String(nameColumn?.getFilterValue() ?? '')"
                    @input="updateFilter"
                />
            </label>
            <output :class="css.status">
                {{ rows.length.toLocaleString() }} rows
            </output>
        </div>
        <div
            :class="css.table"
            role="table"
            aria-label="TanStack people table"
            :aria-rowcount="rows.length + 1"
        >
            <div
                v-for="group in table.getHeaderGroups()"
                :key="group.id"
                :class="css.header"
                role="row"
            >
                <div
                    v-for="header in group.headers"
                    :key="header.id"
                    role="columnheader"
                >
                    <button
                        type="button"
                        :aria-label="`Sort by ${String(header.column.columnDef.header)}`"
                        @click="header.column.toggleSorting()"
                    >
                        <FlexRender :header="header" />
                        {{ header.column.getIsSorted() === "asc" ? " ↑" : "" }}
                        {{ header.column.getIsSorted() === "desc" ? " ↓" : "" }}
                    </button>
                </div>
            </div>
            <VirtualList
                :class="css.list"
                :model="model"
                :get-item-key="getItemKey"
                role="rowgroup"
                aria-label="Virtual table rows"
            >
                <template #default="{ model: itemModel, index }">
                    <div
                        v-if="rows[index]"
                        v-virtual-item="[itemModel, index]"
                        :class="css.row"
                        :data-row-id="rows[index].id"
                        role="row"
                        :aria-rowindex="index + 2"
                    >
                        <div
                            v-for="cell in rows[index].getAllCells()"
                            :key="cell.id"
                            :class="css.cell"
                            role="cell"
                        >
                            <FlexRender :cell="cell" />
                        </div>
                    </div>
                </template>
            </VirtualList>
        </div>
    </div>
</template>
