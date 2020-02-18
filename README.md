# af-react-table
React virtual table with variable rows heights.
Optimized non-recursize segment tree is used to store row dimensions.

[Playground](https://nowaalex.github.io/af-react-table/exampleAssets/)

**TODO**
* happens rarely(after certain width changes), but sometimes I can't scroll to last index(it trembles and hides)
* add resetCache( fromIndex, toIndex ) method
* add rerenderCurrentRange() method
* add mobx example
* write documentation
* implement position: sticky where it is supported
* maybe pass props via context somehow to avoid memos and deep passing?