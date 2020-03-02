import React from "react";
import useApi from "../../../useApi";
import Thead from "../../common/Thead";
import ColgroupCached from "../../common/ColgroupCached";

const SUBSCRIBE_EVENTS = [
    "columns-changed",
    "scroll-left-changed"
];

const TableHead = ({ className }) => {

    const { scrollLeft, columns } = useApi( SUBSCRIBE_EVENTS );

    const style = {
        /* If we do this via transform translate, col background would have bugs during horizontal scroll. Strange webkit behavior */
        marginLeft: -scrollLeft
    };

    return (
        <table className={className} style={style} aria-colcount={columns.length}>
            {ColgroupCached}
            <Thead />
        </table>
    );
};

export default TableHead;