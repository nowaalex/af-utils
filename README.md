# af-virtual-scroll

### Install
`npm install --save af-virtual-scroll`

### Website
https://nowaalex.github.io/af-virtual-scroll/website

### Features
* All heights are calculated automatically, so there is no need to provide them.
* Sortable
* Filterable
* Groupable
* Has column summaries ( count, sum, average, min, max )
* Uses position: sticky for tables
* mobx - ready
* available height and width are calculated and observed automatically
* `scrollToRow(rowIndex)` method is available
* `useApi` can give any table subcomponent access to global API
* renders `table`, `tr`, `td`, `th`, so default table styling, border collapsing, etc. can be easily applied.

### TODO
* mobile fast scrolling causes lags because mobile scroll event is async ( react-virtualized, react-window, devextreme grids also have this problem )