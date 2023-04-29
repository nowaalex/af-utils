const assert = (condition: boolean, errorMessage: string) => {
    if (!condition) {
        throw new Error(errorMessage);
    }
};

export default assert;
