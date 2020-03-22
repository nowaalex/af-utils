# af-virtual-scroll

### Install & use
`npm install --save af-virtual-scroll`

### Website
https://nowaalex.github.io/af-virtual-scroll/website/

### Features
* All heights are calculated automatically, so there is no need to provide them.
* Sortable
* Has column summaries ( count, sum, average )
* Can automatically detect and use position: sticky
* Optimized non-recursive segment tree is used to store row dimensions.
* mobx-ready Row and Cell components, which can be easily wrapped by observer
* available height and width are calculated and observed automatically via `use-resize-observer` hook
* `scrollToRow(rowIndex)` method is available
* fixed and auto table layout mode
* -N ... 0 rowCount handling available via `rowCountWarningsTable` prop
* `useApi` can give any table subcomponent access to global API
* renders `table`, `tr`, `td`, `th`, so default table styling, border collapsing, etc. can be easily applied.


### PropTypes
```javascript
Table.propTypes = {
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            /* unique key for column */
            dataKey: PropTypes.string.isRequired,

            /* 
                If rowData is available, cellData goes through flow, where each fn is optional: render(format((getCellData(rowData,rowIndex))),rowData)
                If not, it goes through flow: getEmptyCellData(rowIndex, column).
            */
            getCellData: PropTypes.func,
            getEmptyCellData: PropTypes.func,
            format: PropTypes.func,
            formatTotal: PropTypes.func,

            visibility: PropTypes.oneOf([ "visible", "hidden" ]),
            sort: PropTypes.oneOf([ "locale", "numeric" ]),

            /*
                column props, affecting colgroup > col tags
            */
            background: PropTypes.string,
            border: PropTypes.string,
            width: PropTypes.oneOfType([ PropTypes.number, PropTypes.string ])
        })
    ).isRequired,
    getRowData: PropTypes.func.isRequired,

    totals: PropTypes.objectOf(
        /* array may contain: "sum", "average", "count". */
        PropTypes.array
    ),
    
    useStickyIfPossible: PropTypes.bool,
    headless: PropTypes.bool,
    className: PropTypes.string,
    rowCount: PropTypes.number,
    getRowKey: PropTypes.func,
    getRowExtraProps: PropTypes.func,
    overscanRowsCount: PropTypes.number,

    HeaderRowComponent: PropTypes.any,
    RowComponent: PropTypes.any,
    CellComponent: PropTypes.any,
    TotalsCellComponent: PropTypes.any,

    RowCountWarningContainer: PropTypes.any,
    rowCountWarningsTable: PropTypes.object,

    /* Determines, if table-layout: fixed is applied to main table */
    fixedLayout: PropTypes.bool
};

Table.defaultProps = {
    rowCount: 0,
    overscanRowsCount: 4,
    fixedLayout: false,
    headless: false,

    /*
        For 90% non-reactive solutions, which only provide new getRowData when data is changed, memo is ok.
        If RowComponent should be wrapped my mobx observer - non-memo version should be imported.
        memo(observer(RowComponentDefault)) will do the trick.
    */
    RowComponent: memo( RowComponentDefault ),
    CellComponent: CellComponentDefault,
    TotalsCellComponent: TotalsCellComponentDefault,
    RowCountWarningContainer: RowCountWarningContainerDefault,
};
```

### TODO
* add rerenderCurrentRange() method
* write documentation
* mobile fast scrolling causes lags because mobile scroll event is async ( react-virtualized, react-window, devextreme grids also have this problem )
* maybe pass props via context somehow to avoid memos and deep passing?
* dynamically adjust estimatedRowHeight on width change( otherwise too few or too much rows could be rendered sometimes)