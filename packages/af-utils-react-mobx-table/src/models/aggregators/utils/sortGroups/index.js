import getSorter from "../getSorter";

const sortGroups = (
    groupsMap,
    getRowData,
    sortDataKey,
    sortDirection,
    depth,
    currentDepth,
    sort
) => {
    const groupValues = groupsMap.values();

    if (currentDepth < depth - 1) {
        for (const group of groupValues) {
            if (group) {
                sortGroups(
                    group,
                    getRowData,
                    sortDataKey,
                    sortDirection,
                    depth,
                    currentDepth + 1,
                    sort
                );
            }
        }
    } else {
        const sortCallback = getSorter(
            getRowData,
            sortDataKey,
            sortDirection,
            sort
        );

        for (const group of groupValues) {
            group?.sort(sortCallback);
        }
    }
};

export default sortGroups;
