import FTreeArray from "models/FTreeArray";

export const syncWithArray = (fTree: FTreeArray, sourceArray: FTreeArray) => {
    fTree.set(sourceArray, 1);

    for (let i = 1, fTreeLength = fTree.length, j; i < fTreeLength; i++) {
        j = i + (i & -i);
        if (j < fTreeLength) {
            fTree[j] += fTree[i];
        }
    }
};

export const update = (
    fTree: FTreeArray,
    i: number,
    delta: number,
    limitTreeLiftingIndex: number
) => {
    for (; i < limitTreeLiftingIndex; i += i & -i) {
        fTree[i] += delta;
    }
};

export const getLiftingLimit = (
    fTree: FTreeArray,
    from: number,
    to: number
) => {
    for (; from < to; from += from & -from);
    return Math.min(from, fTree.length);
};
