import React from "react";
import List from "af-virtual-scroll/lib/List";

const getRowData = index => `row ${index}`;

const SimpleList = ({ className }) => (
    <List
        className={className}
        getRowData={getRowData}
        rowCount={500}
    />
);

export default SimpleList;