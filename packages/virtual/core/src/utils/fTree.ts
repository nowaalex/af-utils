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

export const getLiftingLimit = (lim: number, from: number, to: number) => {
    to &= -(1 << (31 - Math.clz32(from ^ to)));
    return Math.min(to + (to & -to), lim);
};

export const getLiftingLimitNaive = (lim: number, from: number, to: number) => {
    for (from++; from < to; from += from & -from);
    return Math.min(from, lim);
};
