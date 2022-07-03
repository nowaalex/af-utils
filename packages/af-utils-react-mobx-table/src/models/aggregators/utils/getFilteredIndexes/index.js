const getFilteredIndexes = (itemCount, getRowData, filtersMap) => {
    if (filtersMap.size) {
        const result = [];

        mainLoop: for (let j = 0, row; j < itemCount; j++) {
            row = getRowData(j);

            if (row) {
                for (const [key, value] of filtersMap) {
                    if (!("" + row[key]).toLowerCase().includes(value)) {
                        continue mainLoop;
                    }
                }

                result.push(j);
            }
        }

        return result;
    }

    return Array.from({ length: itemCount }, (v, i) => i);
};

export default getFilteredIndexes;
