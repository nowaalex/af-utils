const mapVisibleRange = ({ from, to }, Item, itemData ) => {

    const result = [];

    for( ; from < to; from++ ){
        result.push(
            <Item
                key={from}
                i={from}
                data={itemData}
            />
        );
    }

    return result;
}

export default mapVisibleRange;