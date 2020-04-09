import React from "react";
import useApi from "../../../useApi";
import Colgroup from "../../common/Colgroup";
import { add } from "../../../utils/math";

const SUBSCRIBE_EVENTS = [
    "#columns",
    "#scrollLeft",
    "#widgetWidth",
    "tbody-column-widths-changed"
];

const TableWrapper = ({ children, ...props }) => {

    const { scrollLeft, columns, tbodyColumnWidths } = useApi( SUBSCRIBE_EVENTS );

    const style = {
        /* If we do this via transform translate, col background would have bugs during horizontal scroll. Strange webkit behavior */
        marginLeft: -scrollLeft,
        width: tbodyColumnWidths.reduce( add, 0 )
    };

    return (
        <table {...props} style={style} aria-colcount={columns.length}>
            <Colgroup useTbodyWidths />
            {children}
        </table>
    );
};

export default TableWrapper;