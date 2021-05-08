# af-virtual-scroll

![Virtual scroll preview](https://nowaalex.github.io/af-virtual-scroll/preview.gif)

### Install
`npm install --save af-virtual-scroll`

### Website
https://nowaalex.github.io/af-virtual-scroll/

### Features
* All dimensions are calculated automatically, so there is no need to provide them.
* Uses position: sticky for tables
* mobx - ready
* `scrollToRow(rowIndex)` method is available
* renders `table`, `tr`, `td`, `th`, so default table styling, border collapsing, etc. can be easily applied
* < 3KB gzipped

### Basic usage
```javascript
import { List } from "af-virtual-scroll";

/* style is not required */

const SimpleList = () => (
    <List style={{ width: 400, height: 400 }} rowsQuantity={1000}>
        {i => <div key={i}>row {i}</div>}
    </List>
);
```