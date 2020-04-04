# af-virtual-scroll

### Install & use
`npm install --save af-virtual-scroll`
`import "af-virtual-scroll/lib/style.css";`

### Website
https://nowaalex.github.io/af-virtual-scroll/website/

### Features
* All heights are calculated automatically, so there is no need to provide them.
* Sortable
* Has column summaries ( count, sum, average, min, max )
* Can automatically detect and use position: sticky
* Optimized non-recursive segment tree is used to store row dimensions.
* mobx-ready Row and Cell components, which can be easily wrapped by observer
* available height and width are calculated and observed automatically via `use-resize-observer` hook
* `scrollToRow(rowIndex)` method is available
* fixed and auto table layout mode
* -N ... 0 rowCount handling available via `rowCountWarningsTable` prop
* `useApi` can give any table subcomponent access to global API
* renders `table`, `tr`, `td`, `th`, so default table styling, border collapsing, etc. can be easily applied.

### TODO
* add rerenderCurrentRange() method
* write documentation
* mobile fast scrolling causes lags because mobile scroll event is async ( react-virtualized, react-window, devextreme grids also have this problem )