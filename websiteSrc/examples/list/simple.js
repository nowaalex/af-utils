import React from "react";
import List from "af-virtual-scroll/lib/List";

const getRowData = index => `row ${index}`;

const SimpleList = ({ className }) => (
    <List
        fixedSize
        className={className}
        getRowData={getRowData}
        rowCount={500000}
    />
);

export default SimpleList;