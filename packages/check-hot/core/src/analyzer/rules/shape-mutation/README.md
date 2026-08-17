# Object shape and prototype mutation

## What can go wrong

Writing a new instance field after construction, redefining a property, or
changing a prototype can invalidate hidden-class and prototype-chain
assumptions.

```js
class Model {
    update() {
        this.createdLate = 1;
    }
}
```

Declared fields and properties initialized by the constructor are not reported
as late writes. Shadowed local `Object` and `Reflect` bindings are not confused
with the globals. Class fields are associated with the exact enclosing class
node, so same-name classes in different scopes and anonymous classes do not
share initialization facts. Assignments to `value.__proto__` and
`value["__proto__"]` are reported as possible uses of the legacy prototype
setter; an own data property with that name may make the operation harmless.

## How check-hot confirms it

These operations are advisory when the core cannot safely construct or observe
the receiver. Adapter-owned before/after map and deoptimization checks can turn
them into an explicit experiment.

## Possible remediation

Initialize instance fields consistently in the constructor, finish structural
setup before the hot phase, or separate objects that intentionally have
different roles. Apply a rewrite only after runtime evidence shows a cost.
