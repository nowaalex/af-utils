import React from "react";
import useApi from "../../../useApi";
import ColgroupCached from "../../common/ColgroupCached";

const SUBSCRIBE_EVENTS = [
    "columns-changed",
    "scroll-left-changed"
];

const TableWrapper = ({ className, children }) => {

    const { scrollLeft, columns } = useApi( SUBSCRIBE_EVENTS );

    const style = {
        /* If we do this via transform translate, col background would have bugs during horizontal scroll. Strange webkit behavior */
        marginLeft: -scrollLeft
    };

    return (
        <table className={className} style={style} aria-colcount={columns.length}>
            {ColgroupCached}
            {children}
        </table>
    );
};

export default TableWrapper;