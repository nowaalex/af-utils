export const syncWithArray = (
    fTree: Float64Array,
    sourceArray: ArrayLike<number>
) => {
    fTree.set(sourceArray, 1);

    for (let i = 1, fTreeLength = fTree.length, j = 0; i < fTreeLength; i++) {
        j = i + (i & -i);
        if (j < fTreeLength) {
            fTree[j] += fTree[i];
        }
    }
};

export const update = (
    fTree: Float64Array,
    i: number,
    delta: number,
    limitTreeLiftingIndex: number
) => {
    for (; i < limitTreeLiftingIndex; i += i & -i) {
        fTree[i] += delta;
    }
};

/**
 * Get nearest common ancestor node index for 2 ftree indices.
 * @param firstIndex range start index
 * @param lastIndex range end index
 * @returns nearest common ancestor node index for 2 ftree indices
 */
export const getLiftingLimit = (firstIndex: number, lastIndex: number) => {
    if (firstIndex === lastIndex) {
        return lastIndex + 1;
    }
    lastIndex &= -(1 << (31 - Math.clz32(firstIndex ^ lastIndex)));
    return lastIndex + (lastIndex & -lastIndex);
};

/**
 * Needed just for testing
 * Get nearest common ancestor node index for 2 ftree indices.
 * @param firstIndex range start index
 * @param lastIndex range end index
 * @returns nearest common ancestor node index for 2 ftree indices
 */
export const getLiftingLimitNaive = (firstIndex: number, lastIndex: number) => {
    for (
        firstIndex++;
        firstIndex <= lastIndex;
        firstIndex += firstIndex & -firstIndex
    );
    return firstIndex;
};
