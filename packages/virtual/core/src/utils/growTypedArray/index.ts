const growTypedArray = (
    sourceArray: ArrayLike<number>,
    newLength: number,
    fillValue: number
) => {
    const resultArray = new Uint32Array(newLength);
    resultArray.set(sourceArray);
    resultArray.fill(fillValue, sourceArray.length);
    return resultArray;
};

export default growTypedArray;
