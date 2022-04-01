const getKeyDefault = i => i;

const mapVisibleRange = (
    { from, to },
    Item,
    itemData,
    getKey = getKeyDefault
) => {
    const result = [];

    for (; from < to; from++) {
        result.push(
            <Item key={getKey(from, itemData)} i={from} data={itemData} />
        );
    }

    return result;
};

export default mapVisibleRange;
