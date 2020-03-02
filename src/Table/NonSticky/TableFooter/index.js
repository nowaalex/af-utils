import React from "react";

import useApi from "../../../useApi";
import Tfoot from "../../common/Tfoot";
import ColgroupCached from "../../common/ColgroupCached";

const SUBSCRIBE_EVENTS = [
    "columns-changed",
    "scroll-left-changed",
    "column-widths-changed"
];

const TableFooter = ({ className }) => {

    const { scrollLeft, columns } = useApi( SUBSCRIBE_EVENTS );

    return (
        <table className={className} style={{ marginLeft: -scrollLeft }} aria-colcount={columns.length}>
            {ColgroupCached}
            <Tfoot />
        </table>
    );
};

export default TableFooter;