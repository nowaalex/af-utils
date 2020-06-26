import React, { useCallback, memo } from "react";
import HeaderCells from "./HeaderCells";
import useApi from "../../useApi";

const Thead = ({ trRef, getCellStyle, ...props }) => {

    const API = useApi();

    const clickHandler = useCallback( e => {

        const colIndex = parseInt( e.target.getAttribute( "aria-colindex" ), 10 ) - 1;

        if( process.env.NODE_ENV !== "production" && Number.isNaN( colIndex ) ){
            throw new Error( "colIndex attr missing" );
        }

        const { sort, dataKey } = API.columns[ colIndex ];

        if( e.ctrlKey ){
            API.Rows.modifyAggregators({
                group: API.Rows.aggregators.group && API.Rows.aggregators.group.dataKey === dataKey ? null : {
                    dataKey,
                    value: ""
                }
            });
        }
        else if( sort ){
            const value = e.target.getAttribute( "aria-sort" ) === "ascending" ? "descending" : "ascending";
            API.Rows.modifyAggregators({
                sort: {
                    dataKey,
                    value
                }
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