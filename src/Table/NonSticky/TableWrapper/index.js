import React from "react";
import useApi from "../../../useApi";
import Colgroup from "../../common/Colgroup";
import sum from "lodash/sum";

const SUBSCRIBE_EVENTS = [
    "#columns",
    "#scrollLeft",
    "#widgetWidth",
    "tbody-column-widths"
];

const TableWrapper = ({ className, children }) => {

    const { scrollLeft, columns, tbodyColumnWidths } = useApi( SUBSCRIBE_EVENTS );

    const style = {
        /* If we do this via transform translate, col background would have bugs during horizontal scroll. Strange webkit behavior */
        marginLeft: -scrollLeft,
        width: sum( tbodyColumnWidths )
    };

    return (
        <table className={className} style={style} aria-colcount={columns.length}>
            <Colgroup useTbodyWidths />
            {children}
        </table>
    );
};

export default TableWrapper;