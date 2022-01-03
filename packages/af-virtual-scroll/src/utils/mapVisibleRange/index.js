const mapVisibleRange = ({ from, to }, fn ) => {

    const result = [];

    while( from < to ){
        result.push( fn( from++ ) );
    }

    return result;
}

export default mapVisibleRange;