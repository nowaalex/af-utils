const getRowProps = ( rowData, rowIndex, getRowExtraProps ) => {

    /* avoiding double destructurization via getRowExtraProps, so making prop object once */
    const props = {
        "aria-rowindex": rowIndex + 1
    };

    if( getRowExtraProps ){
        const extraProps = getRowExtraProps( rowData, rowIndex );
        if( extraProps ){
            if( process.env.NODE_ENV !== "production" ){
                if( extraProps.hasOwnProperty( "aria-rowindex" ) ){
                    throw new Error( "getExtraProps must not override aria-rowindex" );
                }
            }
            Object.assign( props, extraProps );
        }
    }

    return props;
}

export default getRowProps;