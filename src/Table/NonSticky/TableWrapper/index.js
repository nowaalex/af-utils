import React from "react";
import useApi from "../../../useApi";
import Colgroup from "../../common/Colgroup";
import cx from "../../../utils/cx";

const SUBSCRIBE_EVENTS = [
    "#columns",
    "#scrollLeft",
    "#widgetWidth",
    "tbody-column-widths-changed"
];

const TableWrapper = ({ children, className, ...props }) => {

    const { scrollLeft, columns, tbodyColumnWidthsSum } = useApi( SUBSCRIBE_EVENTS );

    const style = {
        /* If we do this via transform translate, col background would have bugs during horizontal scroll. Strange webkit behavior */
        marginLeft: -scrollLeft,
        width: tbodyColumnWidthsSum
    };

    return (
        <table className={cx("afvscr-nonst-subtable",className)} {...props} style={style} aria-colcount={columns.length}>
            <Colgroup useTbodyWidths />
            {children}
        </table>
    );
};

export default TableWrapper;