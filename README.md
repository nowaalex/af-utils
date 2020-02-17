# af-react-table
React virtual table with variable rows heights.
Optimized non-recursize segment tree is used to store row dimensions.

[Playground](https://nowaalex.github.io/af-react-table/exampleAssets/)

**TODO**
* reaction on overscanRowsCount prop change causes unnecessary scroll
* when overscan is small endIndex is buggy
* when fixedLayout={false} and width is suddenly increased, endIndex is not recalculated
* add resetCache( fromIndex, toIndex ) method
* add rerenderCurrentRange() method
* add mobx example
* write documentation
* implement position: sticky where it is supported