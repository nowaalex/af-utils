import React, { useCallback, memo } from "react";
import HeaderCells from "./HeaderCells";
import useApi from "../../useApi";

const Thead = ({ trRef, getCellStyle, ...props }) => {

    const API = useApi();

    const clickHandler = useCallback( e => {

        const node = e.target.closest( "[aria-colindex]" );

        if( process.env.NODE_ENV !== "production" && !node ){
            throw new Error( "colIndex attr missing" );
        }

        const colIndex = parseInt( node.getAttribute( "aria-colindex" ), 10 ) - 1;

        const { sort, dataKey } = API.columns[ colIndex ];

        if( e.ctrlKey ){
            API.Rows.aggregators.toggleGrouping( dataKey );
        }
        else if( sort ){
            const value = node.getAttribute( "aria-sort" ) === "ascending" ? "descending" : "ascending";
            API.Rows.aggregators.setSorting({
                dataKey,
                value
            });
        }
    }, []);

    return (
        <thead {...props} onClick={clickHandler}>
            <tr ref={trRef}>
                <HeaderCells />
            </tr>
        </thead>
    );
};

export default memo( Thead );