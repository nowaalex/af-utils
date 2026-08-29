# @af-utils/scrollend-polyfill

This package adds the
[`scrollend` event](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollend_event)
to browsers that do not expose it natively. It supports
`addEventListener`/`removeEventListener`; assigning `onscrollend` is outside the
polyfill boundary.

## Installation

```bash
npm install @af-utils/scrollend-polyfill
```

## Usage

```ts
import "@af-utils/scrollend-polyfill";
```

Import it once at the application entry point. The module does nothing in Node
or when the browser already supports `scrollend`.

## When the event fires

The polyfill dispatches `scrollend` after scrolling has been quiet for a short
period and no tracked touch gesture remains active. Touch cancellation and
aborted, captured, duplicate, or one-time listeners follow the normal event
listener lifecycle.

### Trackpad limitation

Browsers expose desktop trackpad scrolling as a stream of `wheel` and `scroll`
events, without a reliable event for fingers remaining in contact with or being
released from the trackpad. The polyfill therefore uses the quiet period for
trackpad input and may dispatch `scrollend` while the user's fingers are still
resting on the trackpad. Native `scrollend`, when available, remains responsible
for the complete browser-managed gesture and momentum lifecycle.

See the [runnable React example](https://af-utils.vercel.app/scrollend-polyfill/examples/react)
and [bundle-size report](https://af-utils.vercel.app/scrollend-polyfill/size).
