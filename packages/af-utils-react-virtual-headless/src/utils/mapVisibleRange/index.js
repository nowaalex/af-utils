const mapVisibleRange = (model, cb, countOffset) => {
    const result = [];
    let { from, to } = model;

    if (countOffset) {
        for (let delta = model.getOffset(from); from < to; ) {
            result.push(cb(from, delta));
            delta += model.getSize(from++);
        }
    } else {
        for (; from < to; ) {
            result.push(cb(from++));
        }
    }

    return result;
};

export default mapVisibleRange;
