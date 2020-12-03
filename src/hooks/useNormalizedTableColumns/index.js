import { useMemo } from "react";

const useNormalizedTableColumns = columns => useMemo(() => (
    columns.map( column => typeof column === "string" ? { dataKey: column } : column )
), columns );

export default useNormalizedTableColumns;