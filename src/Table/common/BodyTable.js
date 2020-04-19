import React from "react";
import useApi from "../../useApi";

const SUBSCRIBE_EVENTS = [
    "#totalRows",
    "#columns"
];

const BodyTable = ({ children }) => {

    const API = useApi( SUBSCRIBE_EVENTS );

    return (
        <table
            children={children}
            className="afvscr-main-table"
            aria-rowcount={API.totalRows}
            aria-colcount={API.columns.length}
        />
    );
};

export default BodyTable;