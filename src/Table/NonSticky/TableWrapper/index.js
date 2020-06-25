import React from "react";
import { observer } from "mobx-react-lite";
import useApi from "../../../useApi";
import Colgroup from "../../common/Colgroup";
import cx from "../../../utils/cx";

const TableWrapper = ({ children, className, ...props }) => {

    const { scrollLeft, columns, tbodyColumnWidthsSum } = useApi();

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

export default observer( TableWrapper );