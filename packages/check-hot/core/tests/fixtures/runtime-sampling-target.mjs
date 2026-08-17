export const busyCompute = seed => {
    let value = seed | 0;
    for (let index = 0; index < 20_000; index++) {
        value = Math.imul(value ^ index, 1_664_525) | 0;
    }
    return value;
};
