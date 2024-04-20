# Scrollend Event Polyfill

This polyfill adds [scrollend event](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollend_event)
support via `addEventListener` / `removeEventListener`. `onscrollend` event handler is not supported.

## Installation

```bash
npm install @af-utils/scrollend-polyfill
```

## Usage

```tsx
import "@af-utils/scrollend-polyfill";
```

Just import once at the top level. Does nothing when used in `node` environment.

## Implementation Details

Scroll is considered ended when:

-   touch events are not active ( user released touch );
-   `scroll` event was not fired within `100ms` since last invocation.
