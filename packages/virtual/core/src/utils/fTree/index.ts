export const syncWithArray = (
    fTree: Uint32Array,
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
    fTree: Uint32Array,
    i: number,
    delta: number,
    limitTreeLiftingIndex: number
) => {
    for (; i < limitTreeLiftingIndex; i += i & -i) {
        fTree[i] += delta;
    }
};

export const getLiftingLimit = (
    fTree: Uint32Array,
    from: number,
    to: number
) => {
    for (; from < to; from += from & -from);
    return Math.min(from, fTree.length);
};
