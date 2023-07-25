export type RowData = object;
export type RowKey = string | number;

export type RowDataGetter = (rowIndex: number) => RowData;
export type RowKeyGetter = (rowData: RowData) => RowKey;
