---
title: "Variable: VirtualList"
description: Minimal Vue virtual-list component for the common block-list case.
package: "@af-utils/virtual-vue"
symbol: VirtualList
kind: variable
referencePath: /virtual/reference/virtual-vue/variables/VirtualList
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-vue](/virtual/reference/virtual-vue/index) / VirtualList

# Variable: VirtualList

```ts
const VirtualList: DefineComponent<
    ExtractPropTypes<{
        itemData: {
            required: false;
            type: null;
        };
        model: {
            required: true;
            type: typeof VirtualScroller;
        };
    }>,
    () => VNode<
        RendererNode,
        RendererElement,
        {
            [key: string]: any;
        }
    >,
    {},
    {},
    {},
    ComponentOptionsMixin,
    ComponentOptionsMixin,
    {},
    string,
    PublicProps,
    ToResolvedProps<
        ExtractPropTypes<{
            itemData: {
                required: false;
                type: null;
            };
            model: {
                required: true;
                type: typeof VirtualScroller;
            };
        }>,
        {}
    >,
    {},
    {},
    {},
    {},
    string,
    ComponentProvideOptions,
    true,
    {},
    any
>;
```

Minimal Vue virtual-list component for the common block-list case.
