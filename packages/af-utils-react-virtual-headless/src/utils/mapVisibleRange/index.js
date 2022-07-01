const getKeyDefault = i => i;

// default args are transpiled strangely
const mapVisibleRange = (model, Item, itemData, getKey) => (
    (getKey ||= getKeyDefault),
    /*
        i and key order is important in jsx
    */
    Array.from({ length: model.to - model.from }, (_, i) => (
        <Item
            i={(i += model.from)}
            key={getKey(i, itemData)}
            data={itemData}
            model={model}
        />
    ))
);

export default mapVisibleRange;
