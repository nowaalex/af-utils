# Binding writes and parameter provenance

This feature decides whether a value at one AST operation still originates from
a public function parameter. Runtime mutation is allowed only while that origin
is binding-accurate and valid at the exact operation.

## Bad analysis

Treating every equal identifier spelling as one variable either creates a false
experiment or hides a useful one:

```js
export function hot(value) {
    const before = value + 1;
    {
        let value = 0;
        value++;
    }
    value = 2;
    return before;
}
```

The inner `value` is a different lexical binding, and the public parameter is
written only after `value + 1`. That earlier numeric site still has a proven
parameter origin.

## Conservative analysis

[`binding-writes.ts`](./binding-writes.ts) resolves assignment patterns against
their lexical scopes and records invalidation positions. Destructuring,
object-rest parameters, catch bindings, `for-in`/`for-of`, updates, and captured
closure writes are included. Declaration positions are never mistaken for
reads. A captured write invalidates the alias from its declaration because a
hoisted or escaping closure may run before its textual body. Direct `eval` and
`with` remain an automation barrier.

At control-flow joins the rule intentionally prefers `unknown` over a false
proof. A runtime experiment can be added later only when every incoming path
preserves the same origin.
