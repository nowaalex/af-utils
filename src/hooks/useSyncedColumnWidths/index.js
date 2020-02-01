import { useEffect, useReducer } from "react";
import areArraysEqual from "../../utils/areArraysEqual";
import useThrottledCallback from "../../utils/useThrottledCallback";

const MEASURE_THROTTLE_INTERVAL = 800;

const tbodyColumnWidthsReducer = ( curWidths, newWidths ) => areArraysEqual( curWidths, newWidths ) ? curWidths : newWidths;

const useSyncedColumnWidths = ( tableBodyRef, columns ) => {

    const [ tbodyColumnWidths, setTdWidths ] = useReducer(
        tbodyColumnWidthsReducer,
        columns,
        col => col.map( c => c.width || "auto" )
    );

    const measureCellWidthsThrottled = useThrottledCallback(() => {
        const tbody = tableBodyRef.current.getElementsByTagName( "tbody" )[ 0 ];
        if( !tbody ){
            throw new Error( "cannot find tbody element inside TableBody" );
        }
        for( let tr of tbody.children ){
            if( tr.children.length === columns.length ){
                /* we must select "correct" rows without colspans, etc. */
                const pixelWidths = [];
                for( let td of tr.children ){
                    pixelWidths.push( td.offsetWidth );
                }
                setTdWidths( pixelWidths );
                break;
            }
        }
    }, MEASURE_THROTTLE_INTERVAL, [ columns ]);

    useEffect( measureCellWidthsThrottled );

    return tbodyColumnWidths;
};

export default useSyncedColumnWidths;