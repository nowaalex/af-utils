# af-virtual-scroll

![Virtual scroll preview](https://af-virtual-scroll.vercel.app/preview.gif)

### Install
`npm install --save af-virtual-scroll`

### Website
https://af-virtual-scroll.vercel.app/

### Features
* All dimensions are calculated automatically, so there is no need to provide them.
* Uses position: sticky for tables
* mobx - ready
* optimized for performance
* `scrollTo(index)` method is available
* < 3KB gzipped

### Basic usage
```javascript
import { List } from "af-virtual-scroll";

// import once in a project ( not needed for hook )
import "af-virtual-scroll/lib/style.css";

const SimpleList = () => (
    <List itemCount={1000}>
        {i => <div key={i}>row {i}</div>}
    </List>
);
```