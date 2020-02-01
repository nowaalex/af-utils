import { useReducer, useState, useCallback, useEffect } from "react";
import MeasurementsCache from "./MeasurementsCache";
import useThrottledCallback from "../../utils/useThrottledCallback";

const scrollReducer = ( oldScroll, { scrollTop, scrollLeft }) => ({
    bodyScrollTop: scrollTop,
    bodyScrollLeft: scrollLeft
});

const useScrollSync = ( tbodyRef, tbodyHeight, approximateRowHeight, overscanRowsCount, rowCount ) => {
    const Cache = useState(() => new MeasurementsCache );
    const [ bodyScrollState, bodyScrollHandler ] = useReducer( scrollReducer, null, () => ({
        startIndex: 0,
        endIndex: Math.ceil( tbodyHeight / approximateRowHeight ) + overscanRowsCount,
        scrollTop: 0,
        scrollLeft: 0
    }));

    /*useEffect(() => {
        const tbody = tbodyRef.current.getElementsByTagName( "tbody" )[ 0 ];
        if( !tbody ){
            throw new Error( "cannot find tbody element inside TableBody" );
        }
        for( let tr of tbody.children ){
            console.log( "rr", tr.offsetHeight );

        }
    }, [ tbodyHeight, bodyScrollState.scrollTop ]);*/

    return { ...bodyScrollState, bodyScrollHandler };
};

export default useScrollSync;