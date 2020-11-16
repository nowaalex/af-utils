import List from "af-virtual-scroll/List";


/*
    Initial dimensions are not required, but flex-grow/min-width/smth. should be set,
    because otherwise List may collapse to zero-width
*/

const SimpleList = () => (
    <List
        fixed
        style={{ minWidth: 200 }}
        getRowData={i => `row ${i}`}
        rowsQuantity={1000}
    />
);

export default SimpleList;