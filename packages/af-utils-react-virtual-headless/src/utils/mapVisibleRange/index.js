const getKeyDefault = i => i;

const mapVisibleRange = (model, Item, itemData, getKey = getKeyDefault) => {
    const result = [];

    for (let i = model.from, to = model.to; i < to; i++) {
        result.push(
            <Item
                key={getKey(i, itemData)}
                i={i}
                data={itemData}
                model={model}
            />
        );
    }

    return result;
};

export default mapVisibleRange;
