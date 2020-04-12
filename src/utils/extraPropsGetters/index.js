const getPropsGetter = propName => ( data, index, dataIndex, getExtraProps ) => {

    /* avoiding double destructurization via getExtraProps, so making prop object once */
    const props = {
        [propName]: index + 1
    };

    if( getExtraProps ){
        const extraProps = getExtraProps( data, index, dataIndex );
        if( extraProps ){
            if( process.env.NODE_ENV !== "production" ){
                if( extraProps.hasOwnProperty( propName ) ){
                    throw new Error( `getExtraProps must not override ${propName}` );
                }
            }
            Object.assign( props, extraProps );
        }
    }

    return props;
}

export const getRowProps = getPropsGetter( "aria-rowindex" );
export const getCellProps = getPropsGetter( "aria-colindex" );