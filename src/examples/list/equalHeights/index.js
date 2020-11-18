import List from "af-virtual-scroll/List";


/*
    Initial dimensions are not required, but flex-grow/min-width/smth. should be set,
    because otherwise List may collapse to zero-width
*/

const wrapperStyle = { minWidth: 200, maxWidth: 400 };

const SimpleList = () => (
    <List fixed style={wrapperStyle} rowsQuantity={1000}>
        {i => <div key={i}>row {i}</div>}
    </List>
);

export default SimpleList;