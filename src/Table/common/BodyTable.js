import React from "react";
import useApi from "../../useApi";

const SUBSCRIBE_EVENTS = [
    "#totalRows",
    "#columns"
];

const BodyTable = ({ fixedLayout, ...props }) => {

    const API = useApi( SUBSCRIBE_EVENTS );

    const tableStyle = {
        tableLayout: fixedLayout ? "fixed" : "auto",
        minWidth: "100%"
    };
    
    return (
        <table
            {...props}
            aria-rowcount={API.totalRows}
            style={tableStyle}
            aria-colcount={API.columns.length}
        />
    );
};

export default BodyTable;