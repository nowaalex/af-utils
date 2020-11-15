import React from "react";
import { observer } from "mobx-react-lite";
import useApi from "../../useApi";
import cx from "../../utils/cx";
import css from "./style.module.scss";

const BodyTable = ({ children, className }) => {

    const API = useApi();

    return (
        <table
            children={children}
            className={cx(css.wrapper,className)}
            aria-rowcount={API.Rows.visibleRowCount}
            aria-colcount={API.columns.length}
        />
    );
};

export default observer( BodyTable );