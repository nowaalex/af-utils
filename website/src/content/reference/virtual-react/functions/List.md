---
title: "Function: List()"
description: React component. Small abstraction, which in 90% cases allows to avoid hook boilerplate.
package: "@af-utils/virtual-react"
symbol: List
kind: function
referencePath: /virtual/reference/virtual-react/functions/List
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-react](/virtual/reference/virtual-react/index) / List

# Function: List()

```ts
function List<Data, C>(props): Element;
```

React component.
Small abstraction, which in 90% cases allows to avoid hook boilerplate.

## Type Parameters

| Type Parameter              | Default type |
| --------------------------- | ------------ |
| `Data`                      | `unknown`    |
| `C` _extends_ `ElementType` | `"div"`      |

## Parameters

| Parameter | Type                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `props`   | [`ListProps`](/virtual/reference/virtual-react/interfaces/ListProps)\<`C`, `Data`\> & `Omit`\<`ComponentProps`\<`C`\>, `"children"` \| `"ref"`\> |

## Returns

`Element`
