Solid virtual scroll renders huge lists without keeping every row in the DOM.
`createVirtual` owns the model lifecycle, while `List` and
`createVirtualItemRef` connect only the currently visible range.
