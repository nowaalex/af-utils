import React, { useCallback, memo } from "react";
import { css, cx } from "emotion";
import HeaderCellsCached from "../HeaderCellsCached";
import useApi from "../../../useApi";

const SUBSCRIBE_EVENTS = [];

const wrapperClass = css`
    th {
        &[data-sortable] {
            cursor: pointer;
            user-select: none;
        }

        &[aria-sort="ascending"]::after {
            content: " ↑"
        }

        &[aria-sort="descending"]::after {
            content: " ↓";
        }
    }
`;


/*
    TODO:
        When rowCount is 0 - render th's of auto width.
*/
const Thead = ({ className, trRef, getCellStyle, ...props }) => {

    const API = useApi( SUBSCRIBE_EVENTS );

    const clickHandler = useCallback( e => {

        const colIndex = parseInt( e.target.getAttribute( "aria-colindex" ), 10 ) - 1;

        if( process.env.NODE_ENV !== "production" && Number.isNaN( colIndex ) ){
            throw new Error( "colIndex attr missing" );
        }

        if( API.columns[ colIndex ].sort ){
            const directionSign = e.target.getAttribute( "aria-sort" ) === "ascending" ? -1 : 1;
            API.setSortParams( colIndex, directionSign );
        }
    }, [ API.columns ]);

    return (
        <thead className={cx(wrapperClass,className)} onClick={clickHandler}>
            <tr ref={trRef}>
                {HeaderCellsCached}
            </tr>
        </thead>
    );
};

export default memo( Thead );