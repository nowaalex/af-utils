import { List } from "af-virtual-scroll";


/*
    Initial dimensions are not required, but flex-grow/min-width/smth.
    Should be set, because otherwise List may collapse to zero-width
*/

const wrapperStyle = { minWidth: 200, maxWidth: 400 };

const SimpleList = () => (
    <List style={wrapperStyle} itemCount={100} estimatedItemSize={20}>
        {i => <div style={{ padding: "0.5em" }} key={i}>row {i}</div>}
    </List>
);

export default SimpleList;