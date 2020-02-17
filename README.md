# af-react-table
React virtual table with variable rows heights.
Optimized non-recursize segment tree is used to store row dimensions.

[Playground](https://nowaalex.github.io/af-react-table/exampleAssets/)

**TODO**
* reaction on overscanRowsCount prop change
* add resetCache( fromIndex, toIndex ) method
* add rerenderCurrentRange() method
* add mobx example
* write documentation
* implement keyboard navigation(focus becomes lost when rows are rerendered)
* implement position: sticky where it is supported