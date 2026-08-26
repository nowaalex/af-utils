# Object shape and prototype mutation

> **Change Contract**
>
> - **Responsibility:** detect late object-shape and prototype mutations with
>   exact class, receiver, and global-binding ownership.
> - **Boundary:** declared or constructor-initialized fields and shadowed
>   `Object` or `Reflect` bindings must not be reported as mutations.
> - **Invariants:** class identity is node-accurate across scopes and automatic
>   experiments preserve the accepted semantic domain.
> - **Configuration owners:** [detector.ts](./detector.ts) and
>   [experiment.ts](./experiment.ts).
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

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
