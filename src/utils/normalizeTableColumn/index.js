const normalizeTableColumn = column => typeof column === "string" ? { dataKey: column } : column;

export default normalizeTableColumn;