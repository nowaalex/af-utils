---
title: "Class: VirtualScrollerError"
description: Error thrown for an invalid virtual-scroller operation.
package: "@af-utils/virtual-core"
symbol: VirtualScrollerError
kind: class
referencePath: /virtual/reference/virtual-core/classes/VirtualScrollerError
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-core](/virtual/reference/virtual-core/index) / VirtualScrollerError

# Class: VirtualScrollerError

Error thrown for an invalid virtual-scroller operation.

## Remarks

The package's `development` export condition includes detailed diagnostic
messages. The default production export keeps only the stable short code so
consumer production bundles do not retain the diagnostic text.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new VirtualScrollerError(code): VirtualScrollerError;
```

Create a package error with a stable machine-readable code.

#### Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code`    | \| `"AFV_INVALID_INDEX"` \| `"AFV_INVALID_OFFSET"` \| `"AFV_INVALID_ITEM_COUNT"` \| `"AFV_INVALID_ITEM_SIZE"` \| `"AFV_INVALID_WIDGET_SIZE"` \| `"AFV_INVALID_SCROLLER_OFFSET"` \| `"AFV_INVALID_OVERSCAN"` \| `"AFV_INVALID_ATTEMPTS"` \| `"AFV_INVALID_SPLICE"` \| `"AFV_INVALID_RANGE"` \| `"AFV_EMPTY_MODEL"` \| `"AFV_DISPOSED"` \| `"AFV_BATCH_INVARIANT"` \| `"AFV_MODEL_CHANGED"` |

#### Returns

`VirtualScrollerError`

#### Overrides

```ts
Error.constructor;
```

## Properties

| Property                                                | Modifier   | Type                                                                                                                                                                                                                                                                                                                                                                                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                       | Inherited from          |
| ------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| <a id="property-cause"></a> `cause?`                    | `public`   | `unknown`                                                                                                                                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `Error.cause`           |
| <a id="property-code"></a> `code`                       | `readonly` | \| `"AFV_INVALID_INDEX"` \| `"AFV_INVALID_OFFSET"` \| `"AFV_INVALID_ITEM_COUNT"` \| `"AFV_INVALID_ITEM_SIZE"` \| `"AFV_INVALID_WIDGET_SIZE"` \| `"AFV_INVALID_SCROLLER_OFFSET"` \| `"AFV_INVALID_OVERSCAN"` \| `"AFV_INVALID_ATTEMPTS"` \| `"AFV_INVALID_SPLICE"` \| `"AFV_INVALID_RANGE"` \| `"AFV_EMPTY_MODEL"` \| `"AFV_DISPOSED"` \| `"AFV_BATCH_INVARIANT"` \| `"AFV_MODEL_CHANGED"` | Stable machine-readable error code.                                                                                                                                                                                                                                                                                                                                                                                                               | -                       |
| <a id="property-message"></a> `message`                 | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                  | -                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `Error.message`         |
| <a id="property-name"></a> `name`                       | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                  | -                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `Error.name`            |
| <a id="property-stack"></a> `stack?`                    | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                  | -                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `Error.stack`           |
| <a id="property-stacktracelimit"></a> `stackTraceLimit` | `static`   | `number`                                                                                                                                                                                                                                                                                                                                                                                  | The `Error.stackTraceLimit` property specifies the number of stack frames collected by a stack trace (whether generated by `new Error().stack` or `Error.captureStackTrace(obj)`). The default value is `10` but may be set to any valid JavaScript number. Changes will affect any stack trace captured _after_ the value has been changed. If set to a non-number value, or set to a negative number, stack traces will not capture any frames. | `Error.stackTraceLimit` |

## Methods

### captureStackTrace()

```ts
static captureStackTrace(targetObject, constructorOpt?): void;
```

Creates a `.stack` property on `targetObject`, which when accessed returns
a string representing the location in the code at which
`Error.captureStackTrace()` was called.

```js
const myObject = {};
Error.captureStackTrace(myObject);
myObject.stack; // Similar to `new Error().stack`
```

The first line of the trace will be prefixed with
`${myObject.name}: ${myObject.message}`.

The optional `constructorOpt` argument accepts a function. If given, all frames
above `constructorOpt`, including `constructorOpt`, will be omitted from the
generated stack trace.

The `constructorOpt` argument is useful for hiding implementation
details of error generation from the user. For instance:

```js
function a() {
    b();
}

function b() {
    c();
}

function c() {
    // Create an error without stack trace to avoid calculating the stack trace twice.
    const { stackTraceLimit } = Error;
    Error.stackTraceLimit = 0;
    const error = new Error();
    Error.stackTraceLimit = stackTraceLimit;

    // Capture the stack trace above function b
    Error.captureStackTrace(error, b); // Neither function c, nor b is included in the stack trace
    throw error;
}

a();
```

#### Parameters

| Parameter         | Type       |
| ----------------- | ---------- |
| `targetObject`    | `object`   |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

```ts
Error.captureStackTrace;
```

---

### prepareStackTrace()

```ts
static prepareStackTrace(err, stackTraces): any;
```

#### Parameters

| Parameter     | Type         |
| ------------- | ------------ |
| `err`         | `Error`      |
| `stackTraces` | `CallSite`[] |

#### Returns

`any`

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

```ts
Error.prepareStackTrace;
```
