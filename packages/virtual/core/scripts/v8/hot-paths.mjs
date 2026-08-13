const hotPath = (owner, method) => ({ owner, method });

// Keep this list explicit: only performance-sensitive methods belong here.
// The runner resolves every entry against the built classes, so deleting or
// renaming a listed method fails the regular test command.
export const HOT_PATHS = Object.freeze({
    sizeIndexGetOffset: hotPath("SizeIndex", "_getOffset"),
    sizeIndexGetIndex: hotPath("SizeIndex", "_getIndex"),
    sizeIndexUpdateSize: hotPath("SizeIndex", "_updateSize"),
    virtualScrollerGetOffset: hotPath("VirtualScroller", "getOffset"),
    virtualScrollerGetIndex: hotPath("VirtualScroller", "getIndex"),
    virtualScrollerSetItemCount: hotPath("VirtualScroller", "setItemCount"),
    virtualScrollerSyncScrollPosition: hotPath(
        "VirtualScroller",
        "_syncScrollPosition"
    ),
    virtualScrollerSubscribe: hotPath("VirtualScroller", "subscribe"),
    virtualScrollerGetRevision: hotPath("VirtualScroller", "getRevision"),
    virtualScrollerApplyMeasurements: hotPath(
        "VirtualScroller",
        "_applyMeasurements"
    ),
    eventsBeginBatch: hotPath("VirtualScrollerEvents", "_beginBatch"),
    eventsEmit: hotPath("VirtualScrollerEvents", "_emit"),
    eventsEndBatch: hotPath("VirtualScrollerEvents", "_endBatch"),
    eventsNotify: hotPath("VirtualScrollerEvents", "_notify"),
    scrollActivityOnNativeScroll: hotPath(
        "ScrollActivity",
        "_onNativeScroll"
    ),
    scrollActivityOnNativeScrollEnd: hotPath(
        "ScrollActivity",
        "_onNativeScrollEnd"
    ),
    stickyApplyResizeEntries: hotPath(
        "StickyElements",
        "_applyResizeEntries"
    ),
    layoutApplyItemsGeometry: hotPath(
        "VirtualScrollerLayout",
        "_applyItemsGeometry"
    )
});

export const PRIVATE_FIELD_HOT_PATHS = Object.freeze({
    typescriptPrivateStep: hotPath("TypeScriptPrivateState", "step"),
    typescriptPrivateRun: hotPath("TypeScriptPrivateState", "run"),
    nativePrivateStep: hotPath("NativePrivateState", "step"),
    nativePrivateRun: hotPath("NativePrivateState", "run")
});

export const getHotPathMethodNames = (definitions) => [
    ...new Set(Object.values(definitions).map(({ method }) => method))
];

export const resolveHotPaths = (definitions, holders) => {
    const entries = [];
    const methods = {};
    const labels = new Set();
    const functions = new Set();

    for (const [id, { owner, method }] of Object.entries(definitions)) {
        const label = `${owner}.${method}`;
        const holder = holders[owner];

        if (!holder) {
            throw new Error(
                `V8 hot path ${id} refers to unknown owner ${owner}`
            );
        }
        if (labels.has(label)) {
            throw new Error(`V8 hot path ${label} is listed more than once`);
        }

        const descriptor = Object.getOwnPropertyDescriptor(holder, method);
        if (!descriptor) {
            throw new Error(
                `V8 hot path ${label} does not exist; update hot-paths.mjs after a rename or deletion`
            );
        }
        if (typeof descriptor.value !== "function") {
            throw new Error(`V8 hot path ${label} is not a method`);
        }
        if (functions.has(descriptor.value)) {
            throw new Error(
                `V8 hot path ${label} duplicates another function reference`
            );
        }

        labels.add(label);
        functions.add(descriptor.value);
        methods[id] = descriptor.value;
        entries.push({ id, label, fn: descriptor.value });
    }

    return { entries, methods };
};
