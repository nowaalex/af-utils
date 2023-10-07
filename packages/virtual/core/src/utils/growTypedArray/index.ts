import FTreeArray from "models/FTreeArray";

const growTypedArray = (
    sourceArray: FTreeArray,
    newLength: number,
    fillValue: number
) => {
    const resultArray = new FTreeArray(newLength);
    resultArray.set(sourceArray);
    resultArray.fill(fillValue, sourceArray.length);
    return resultArray;
};

export default growTypedArray;
