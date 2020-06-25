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

        if( API.columns[ colIndex ].sort ){
            const directionSign = e.target.getAttribute( "aria-sort" ) === "ascending" ? -1 : 1;
            API.setSortParams( colIndex, directionSign );
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