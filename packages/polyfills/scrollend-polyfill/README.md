# Polyfill for scrollend event

```typesctipt
import "@af-utils/scrollend-polyfill";
```

Scroll is considered ended when:

-   touch events are not active ( user released touch );
-   `scroll` event was not fired within `100ms` since last invocation.

Does nothing when used in `node` environment.
