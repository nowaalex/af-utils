export type RowData = Record<string, any>;

export type RowKey = string | number;
export type ColumnKey = string | number;

export type RowDataGetter = (rowIndex: number) => RowData;
export type RowKeyGetter = (rowData: RowData) => RowKey;

export type SortState = {
    column: string | number;
};

export type GroupState = {
    column: string | number;
};
