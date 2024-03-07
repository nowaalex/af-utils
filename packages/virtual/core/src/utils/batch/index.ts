import { call } from "utils/misc";

const BatchQueue = new Set<() => void>();

export let batchLevel = 0;

export const batchEnd = () => {
    if (!--batchLevel) {
        BatchQueue.forEach(call);
        BatchQueue.clear();
    }
};

export const batchStart = () => ++batchLevel;

export const addToBatchQueue = (fn: () => void) => BatchQueue.add(fn);
