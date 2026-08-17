import { defineHotTarget } from "@af-utils/check-hot";
import { annotatedHotTargets } from "../../.jit/annotated-targets.mjs";

const ITEM_COUNT = 10_001;
const ESTIMATED_ITEM_SIZE = 40.25;
const VIEWPORT_SIZE = 600.5;
const PRIVATE_INSTANCE_COUNT = 16;
const MEASUREMENT_COUNT = 64;

const createStyle = () => ({
    getPropertyPriority: () => "",
    getPropertyValue: () => "",
    removeProperty() {},
    setProperty() {}
});

const createOwnerWindow = () => ({
    addEventListener() {},
    getComputedStyle: () => ({ position: "static", zIndex: "auto" }),
    removeEventListener() {}
});

const createElementScroller = (nativeScrollEnd) => {
    const target = {
        scrollTop: 0.0,
        scrollLeft: 0.0,
        clientHeight: VIEWPORT_SIZE,
        clientWidth: VIEWPORT_SIZE,
        clientTop: 0,
        clientLeft: 0,
        ownerDocument: { defaultView: createOwnerWindow() },
        addEventListener() {},
        removeEventListener() {},
        getBoundingClientRect: () => ({ top: 0.0, left: 0.0 }),
        scroll(options) {
            if (options.top !== undefined) this.scrollTop = options.top;
            if (options.left !== undefined) this.scrollLeft = options.left;
        }
    };
    if (nativeScrollEnd) target.onscrollend = null;
    return target;
};

const createWindowScroller = (nativeScrollEnd) => {
    const target = {
        window: null,
        scrollY: 0.0,
        scrollX: 0.0,
        innerHeight: VIEWPORT_SIZE,
        innerWidth: VIEWPORT_SIZE,
        document: {
            documentElement: {
                clientHeight: VIEWPORT_SIZE,
                clientWidth: VIEWPORT_SIZE
            }
        },
        addEventListener() {},
        removeEventListener() {},
        scroll(options) {
            if (options.top !== undefined) this.scrollY = options.top;
            if (options.left !== undefined) this.scrollX = options.left;
        }
    };
    if (nativeScrollEnd) target.onscrollend = null;
    target.window = target;
    return target;
};

const createScheduler = () => {
    let now = 0.0;
    let nextId = 0;
    const callbacks = new Map();

    return {
        _now: () => now,
        _setTimeout(callback) {
            const id = ++nextId;
            callbacks.set(id, callback);
            return id;
        },
        _clearTimeout(id) {
            callbacks.delete(id);
        },
        advance() {
            now += 256.5;
            const pending = [...callbacks.values()];
            callbacks.clear();
            for (const callback of pending) callback();
        }
    };
};

const setup = async () => {
    const [
        { VirtualScrollerEvent },
        { NativePrivateState, TypeScriptPrivateState },
        { default: SizeIndex },
        { default: VirtualScroller },
        { default: ScrollActivity },
        { default: VirtualScrollerLayout }
    ] = await Promise.all([
        import("../../src/constants/index.ts"),
        import("../../src/benchmarks/privateFieldFixture.ts"),
        import("../../src/models/SizeIndex/index.ts"),
        import("../../src/models/VirtualScroller/index.ts"),
        import("../../src/models/VirtualScroller/scrollActivity/index.ts"),
        import("../../src/models/VirtualScrollerLayout/index.ts")
    ]);
    globalThis.ResizeObserver = class {
        constructor(callback) {
            this.callback = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
    };
    globalThis.window = createOwnerWindow();
    globalThis.requestAnimationFrame = () => 1;
    globalThis.cancelAnimationFrame = () => {};

    for (let iteration = 0; iteration < PRIVATE_INSTANCE_COUNT; iteration++) {
        new SizeIndex(20.25 + iteration);
        new VirtualScroller({ itemCount: iteration });
        new VirtualScrollerLayout(new VirtualScroller());
    }

    const sizeIndexes = [
        new SizeIndex(40),
        new SizeIndex(ESTIMATED_ITEM_SIZE),
        new SizeIndex(19.75)
    ];
    for (const index of sizeIndexes) index._setCount(ITEM_COUNT);

    const scrollers = [
        createElementScroller(true),
        createElementScroller(false),
        createWindowScroller(true),
        createWindowScroller(false)
    ];
    const models = [
        new VirtualScroller({
            estimatedItemSize: ESTIMATED_ITEM_SIZE,
            estimatedWidgetSize: VIEWPORT_SIZE,
            itemCount: ITEM_COUNT
        }),
        new VirtualScroller({
            estimatedItemSize: ESTIMATED_ITEM_SIZE,
            estimatedWidgetSize: VIEWPORT_SIZE,
            horizontal: true,
            itemCount: ITEM_COUNT
        }),
        new VirtualScroller({
            estimatedItemSize: ESTIMATED_ITEM_SIZE,
            estimatedWidgetSize: VIEWPORT_SIZE,
            itemCount: ITEM_COUNT
        }),
        new VirtualScroller({
            estimatedItemSize: ESTIMATED_ITEM_SIZE,
            estimatedWidgetSize: VIEWPORT_SIZE,
            horizontal: true,
            itemCount: ITEM_COUNT
        })
    ];
    for (let index = 0; index < models.length; index++) {
        models[index].setScroller(scrollers[index]);
    }
    const pristineRepresentationModel = new VirtualScroller({
        estimatedItemSize: ESTIMATED_ITEM_SIZE,
        estimatedWidgetSize: VIEWPORT_SIZE,
        itemCount: ITEM_COUNT
    });

    const measurementEntries = models.map((model, modelIndex) => {
        const entries = [];
        for (let itemIndex = 0; itemIndex < MEASUREMENT_COUNT; itemIndex++) {
            const target = {};
            model._items._elementIndexes.set(target, itemIndex);
            entries.push({
                target,
                borderBoxSize: [
                    {
                        blockSize: 30.5 + ((itemIndex + modelIndex) % 17),
                        inlineSize: 31.25 + ((itemIndex + modelIndex) % 19)
                    }
                ]
            });
        }
        entries.push({
            target: {},
            borderBoxSize: [{ blockSize: 0.0, inlineSize: 0.0 }]
        });
        return entries;
    });

    const stickyEntries = models.map((model, modelIndex) => {
        const header = {};
        const footer = {};
        model._sticky._elements[0] = header;
        model._sticky._elements[1] = footer;
        return [
            {
                target: header,
                borderBoxSize: [
                    { blockSize: 10.5 + modelIndex, inlineSize: 11.25 + modelIndex }
                ]
            },
            {
                target: footer,
                borderBoxSize: [
                    { blockSize: 20.25 + modelIndex, inlineSize: 21.5 + modelIndex }
                ]
            },
            {
                target: {},
                borderBoxSize: [{ blockSize: 99.5, inlineSize: 99.5 }]
            }
        ];
    });
    for (let index = 0; index < models.length; index++) {
        models[index]._applyMeasurements(measurementEntries[index]);
        models[index]._sticky._applyResizeEntries(stickyEntries[index]);
    }

    const layouts = [
        new VirtualScrollerLayout(models[0]),
        new VirtualScrollerLayout(models[1])
    ];
    for (const layout of layouts) layout.setItemsElement({ style: {} });

    const scheduler = createScheduler();
    let scrollActivitySink = 0;
    const scrollActivities = [
        new ScrollActivity(() => scrollActivitySink++, scheduler),
        new ScrollActivity(() => scrollActivitySink++, scheduler)
    ];
    scrollActivities[0]._setNativeScrollEndSupported(true);
    scrollActivities[1]._setNativeScrollEndSupported(false);

    let eventSink = 0;
    const eventCallbacks = [
        () => eventSink++,
        () => (eventSink += 2),
        () => (eventSink += 3)
    ];
    const eventMasks = [
        VirtualScrollerEvent.RANGE,
        VirtualScrollerEvent.SCROLL_SIZE,
        VirtualScrollerEvent.SIZES
    ];
    const permanentUnsubscribers = eventCallbacks.map((callback, index) =>
        models[0].subscribe(callback, eventMasks[index])
    );
    models[0].subscribe(eventCallbacks[0])();

    const nativePrivate = Array.from(
        { length: PRIVATE_INSTANCE_COUNT },
        (_, index) => new NativePrivateState(index)
    );
    const ordinaryPrivate = Array.from(
        { length: PRIVATE_INSTANCE_COUNT },
        (_, index) => new TypeScriptPrivateState(index)
    );

    return {
        eventCallbacks,
        eventAll: VirtualScrollerEvent.ALL,
        eventMasks,
        get eventSink() {
            return eventSink;
        },
        layouts,
        measurementEntries,
        models,
        hotTargetOwners: {
            ElementScrollerAdapter: models[0]._scrollerAdapter,
            NativePrivateState: nativePrivate[0],
            ScrollActivity: scrollActivities[0],
            SizeIndex: sizeIndexes[0],
            StickyElements: models[0]._sticky,
            TypeScriptPrivateState: ordinaryPrivate[0],
            VirtualScroller: models[0],
            VirtualScrollerEvents: models[0]._events,
            WindowScrollerAdapter: models[2]._scrollerAdapter
        },
        nativePrivate,
        ordinaryPrivate,
        permanentUnsubscribers,
        pristineRepresentationModel,
        scheduler,
        scrollActivities,
        get scrollActivitySink() {
            return scrollActivitySink;
        },
        scrollers,
        sizeIndexes,
        stickyEntries
    };
};

const hot = {
    ...annotatedHotTargets,
    verticalItemsGeometry: defineHotTarget(
        "VirtualScrollerLayout.verticalItemsGeometry",
        state => state.layouts[0]._applyItemsGeometry,
        false
    ),
    horizontalItemsGeometry: defineHotTarget(
        "VirtualScrollerLayout.horizontalItemsGeometry",
        state => state.layouts[1]._applyItemsGeometry,
        false
    )
};

const scenarios = [
    {
        id: "size-index-boundaries-and-fractions",
        targets: [
            hot.sizeIndexGetOffset,
            hot.sizeIndexGetIndex,
            hot.sizeIndexUpdateSize,
            hot.sizeIndexCompleteUpdateBatch
        ],
        run({ state, iteration, invoke }) {
            const index = state.sizeIndexes[iteration % state.sizeIndexes.length];
            const itemIndex = iteration % ITEM_COUNT;
            const queryKinds = [
                -1.0,
                0.0,
                index._totalSize,
                index._totalSize + 0.5,
                (iteration * 97.25) % index._totalSize
            ];
            invoke(hot.sizeIndexGetOffset, index, [itemIndex]);
            invoke(hot.sizeIndexGetIndex, index, [
                queryKinds[iteration % queryKinds.length]
            ]);
            const updateLimit = index._getUpdateLimit(itemIndex, itemIndex + 1);
            const size = iteration % 23 === 0 ? 0.0 : 30.25 + (iteration % 17);
            const delta = invoke(hot.sizeIndexUpdateSize, index, [
                itemIndex,
                size,
                updateLimit
            ]);
            invoke(hot.sizeIndexCompleteUpdateBatch, index, [updateLimit, delta]);
        }
    },
    {
        id: "four-scroller-modes-and-directions",
        targets: [
            hot.virtualScrollerGetOffset,
            hot.virtualScrollerGetIndex,
            hot.virtualScrollerSetItemCount,
            hot.virtualScrollerSyncScrollPosition,
            hot.virtualScrollerUpdateRangeFromEnd,
            hot.virtualScrollerUpdateRangeFromStart
        ],
        run({ state, iteration, invoke }) {
            const mode = iteration % state.models.length;
            const model = state.models[mode];
            const scroller = state.scrollers[mode];
            const cycle = iteration % 512;
            const directional = cycle < 256 ? cycle : 512 - cycle;
            const maxOffset = Math.max(0.0, model.scrollSize - VIEWPORT_SIZE);
            const offset = (directional * 193.25) % Math.max(1.0, maxOffset);
            if (model.horizontal) {
                if (scroller.window === scroller) scroller.scrollX = offset;
                else scroller.scrollLeft = offset;
            } else if (scroller.window === scroller) scroller.scrollY = offset;
            else scroller.scrollTop = offset;

            invoke(hot.virtualScrollerGetOffset, model, [iteration % model.itemCount]);
            invoke(hot.virtualScrollerGetIndex, model, [
                (iteration * 97.25) % model.scrollSize
            ]);
            invoke(hot.virtualScrollerSyncScrollPosition, model);
            invoke(hot.virtualScrollerUpdateRangeFromEnd, model);
            invoke(hot.virtualScrollerUpdateRangeFromStart, model);
            invoke(hot.virtualScrollerSetItemCount, model, [
                ITEM_COUNT - (iteration & 1)
            ]);
        }
    },
    {
        id: "subscriptions-immediate-nested-and-reentrant",
        targets: [
            hot.virtualScrollerSubscribe,
            hot.virtualScrollerGetRevision,
            hot.virtualScrollerEventsBeginBatch,
            hot.virtualScrollerEventsEmit,
            hot.virtualScrollerEventsEndBatch,
            hot.virtualScrollerEventsNotify
        ],
        run({ state, iteration, invoke }) {
            const model = state.models[0];
            const events = model._events;
            const event = state.eventMasks[iteration % state.eventMasks.length];
            const unsubscribe = invoke(hot.virtualScrollerSubscribe, model, [
                state.eventCallbacks[iteration % state.eventCallbacks.length],
                state.eventAll
            ]);
            invoke(hot.virtualScrollerEventsBeginBatch, events);
            invoke(hot.virtualScrollerEventsBeginBatch, events);
            invoke(hot.virtualScrollerEventsEmit, events, [event]);
            invoke(hot.virtualScrollerEventsEndBatch, events);
            invoke(hot.virtualScrollerEventsEndBatch, events);
            invoke(hot.virtualScrollerEventsNotify, events, [
                state.eventAll
            ]);
            invoke(hot.virtualScrollerGetRevision, model, [
                state.eventAll
            ]);
            unsubscribe();
        }
    },
    {
        id: "measurement-batches-axis-zero-and-stale",
        targets: [hot.virtualScrollerApplyMeasurements],
        run({ state, iteration, invoke }) {
            const mode = iteration % state.models.length;
            const entries = state.measurementEntries[mode];
            const size = entries[iteration % MEASUREMENT_COUNT].borderBoxSize[0];
            size.blockSize = iteration % 29 === 0 ? 0.0 : 30.5 + (iteration % 17);
            size.inlineSize = iteration % 31 === 0 ? 0.0 : 31.25 + (iteration % 19);
            invoke(hot.virtualScrollerApplyMeasurements, state.models[mode], [
                entries
            ]);
        }
    },
    {
        id: "native-fallback-and-programmatic-scroll-activity",
        targets: [
            hot.scrollActivityOnNativeScroll,
            hot.scrollActivityOnNativeScrollEnd,
            hot.scrollActivityStartProgrammaticScroll,
            hot.scrollActivitySetIndexConverging
        ],
        run({ state, iteration, invoke }) {
            const activity = state.scrollActivities[iteration & 1];
            invoke(hot.scrollActivityOnNativeScroll, activity);
            invoke(hot.scrollActivityStartProgrammaticScroll, activity, [128.5]);
            invoke(hot.scrollActivitySetIndexConverging, activity, [true]);
            invoke(hot.scrollActivitySetIndexConverging, activity, [false]);
            invoke(hot.scrollActivityOnNativeScrollEnd, activity);
            state.scheduler.advance();
        }
    },
    {
        id: "sticky-header-footer-and-axis-measurements",
        targets: [hot.stickyElementsApplyResizeEntries],
        run({ state, iteration, invoke }) {
            const mode = iteration % state.models.length;
            const entries = state.stickyEntries[mode];
            const firstSize = entries[0].borderBoxSize[0];
            firstSize.blockSize = 10.5 + (iteration & 1);
            firstSize.inlineSize = 11.25 + (iteration & 1);
            invoke(hot.stickyElementsApplyResizeEntries, state.models[mode]._sticky, [
                entries
            ]);
        }
    },
    {
        id: "vertical-and-horizontal-layout",
        targets: [
            hot.verticalItemsGeometry,
            hot.horizontalItemsGeometry
        ],
        run({ state, invoke }) {
            invoke(hot.verticalItemsGeometry, state.layouts[0]);
            invoke(hot.horizontalItemsGeometry, state.layouts[1]);
        }
    },
    {
        id: "element-and-window-axis-adapters",
        targets: [
            hot.elementScrollerAdapterReadOffset,
            hot.windowScrollerAdapterReadOffset
        ],
        run({ state, iteration, invoke }) {
            const elementModel = state.models[iteration & 1];
            const windowModel = state.models[2 + (iteration & 1)];
            invoke(
                hot.elementScrollerAdapterReadOffset,
                elementModel._scrollerAdapter
            );
            invoke(
                hot.windowScrollerAdapterReadOffset,
                windowModel._scrollerAdapter
            );
        }
    },
    {
        id: "typescript-and-native-private-fields",
        targets: [
            hot.typeScriptPrivateStateStep,
            hot.typeScriptPrivateStateRun,
            hot.nativePrivateStateStep,
            hot.nativePrivateStateRun
        ],
        run({ state, iteration, invoke }) {
            const slot = iteration & (PRIVATE_INSTANCE_COUNT - 1);
            const ordinary = state.ordinaryPrivate[slot];
            const native = state.nativePrivate[slot];
            invoke(hot.typeScriptPrivateStateStep, ordinary, [iteration]);
            invoke(hot.nativePrivateStateStep, native, [iteration]);
            invoke(hot.typeScriptPrivateStateRun, ordinary, [2, iteration]);
            invoke(hot.nativePrivateStateRun, native, [2, iteration]);
        }
    }
];

const assertFast = (engine, expect, label, value) => {
    expect(engine.hasFastProperties(value), `${label} uses dictionary properties`);
    expect(
        !engine.hasDictionaryElements(value),
        `${label} uses dictionary elements`
    );
};

const assertPacked = (engine, expect, label, value, kind) => {
    expect(Array.isArray(value), `${label} is not an Array`);
    expect(engine.isPackedArray(value), `${label} is not a packed fast array`);
    expect(
        engine.arrayElementsKind(value) === kind,
        `${label} uses ${engine.arrayElementsKind(value)} elements, expected ${kind}`
    );
};

const checks = [
    {
        id: "stable-maps-and-initial-representations",
        phase: "setup",
        engines: ["v8"],
        run({ state, engine, expect, inspect }) {
            for (const [index, value] of state.sizeIndexes.entries()) {
                assertFast(engine, expect, `SizeIndex[${index}]`, value);
                expect(
                    value._sizes instanceof Float64Array &&
                        value._tree instanceof Float64Array,
                    `SizeIndex[${index}] lost Float64Array storage`
                );
                expect(
                    engine.sameMap(state.sizeIndexes[0], value),
                    `SizeIndex[${index}] has a different hidden class`
                );
            }
            for (const [index, model] of state.models.entries()) {
                assertFast(engine, expect, `VirtualScroller[${index}]`, model);
                expect(
                    engine.sameMap(state.models[0], model),
                    `VirtualScroller[${index}] has a different hidden class`
                );
                assertPacked(
                    engine,
                    expect,
                    `VirtualScroller[${index}]._events._subscriptions`,
                    model._events._subscriptions,
                    "OBJECT"
                );
                assertPacked(
                    engine,
                    expect,
                    `VirtualScroller[${index}]._events._eventRevisions`,
                    model._events._eventRevisions,
                    "SMI"
                );
                assertPacked(
                    engine,
                    expect,
                    `VirtualScroller[${index}]._sticky._sizes`,
                    model._sticky._sizes,
                    "DOUBLE"
                );
            }
            assertPacked(
                engine,
                expect,
                "VirtualScroller.pristine._sticky._sizes",
                state.pristineRepresentationModel._sticky._sizes,
                "SMI"
            );
            expect(
                engine.sameMap(state.models[0]._events, state.models[1]._events),
                "event dispatchers do not share a hidden class"
            );
            expect(
                engine.sameMap(state.models[0]._items, state.models[1]._items),
                "item registries do not share a hidden class"
            );
            expect(
                engine.sameMap(state.models[0]._sticky, state.models[1]._sticky),
                "sticky state does not share a hidden class"
            );
            expect(
                engine.sameMap(
                    state.models[0]._scrollerAdapter,
                    state.models[1]._scrollerAdapter
                ),
                "element adapters do not share a hidden class"
            );
            expect(
                engine.sameMap(
                    state.models[2]._scrollerAdapter,
                    state.models[3]._scrollerAdapter
                ),
                "window adapters do not share a hidden class"
            );
            expect(
                !engine.sameMap(
                    state.models[0]._scrollerAdapter,
                    state.models[2]._scrollerAdapter
                ),
                "element and window adapters unexpectedly share a hidden class"
            );
            if (inspect) {
                engine.debugPrint(state.models[0]);
                engine.debugPrint(state.models[0]._events._subscriptions);
                engine.debugPrint(state.sizeIndexes[0]._sizes);
            }
        }
    },
    {
        id: "fractional-sticky-elements-transition-to-double",
        engines: ["v8"],
        scenarios: ["sticky-header-footer-and-axis-measurements"],
        run({ state, engine, expect }) {
            for (const [index, model] of state.models.entries()) {
                assertPacked(
                    engine,
                    expect,
                    `VirtualScroller[${index}]._sticky._sizes`,
                    model._sticky._sizes,
                    "DOUBLE"
                );
            }
        }
    },
    {
        id: "maps-remain-stable-after-warmup",
        phase: "afterWarmup",
        engines: ["v8"],
        run({ state, engine, expect }) {
            for (let index = 1; index < state.models.length; index++) {
                expect(
                    engine.sameMap(state.models[0], state.models[index]),
                    `VirtualScroller[${index}] diverged after warmup`
                );
                expect(
                    engine.sameMap(
                        state.models[0]._events,
                        state.models[index]._events
                    ),
                    `VirtualScrollerEvents[${index}] diverged after warmup`
                );
            }
        }
    },
    {
        id: "maps-remain-stable-after-stress",
        engines: ["v8"],
        run({ state, engine, expect }) {
            for (let index = 1; index < state.models.length; index++) {
                expect(
                    engine.sameMap(state.models[0], state.models[index]),
                    `VirtualScroller[${index}] diverged after stress`
                );
            }
        }
    },
    {
        id: "scenario-sinks-remain-finite",
        run({ state, expect }) {
            expect(Number.isFinite(state.eventSink), "event sink is not finite");
            expect(
                Number.isFinite(state.scrollActivitySink),
                "scroll-activity sink is not finite"
            );
        }
    }
];

export default {
    name: "@af-utils/virtual-core",
    setup,
    teardown(state) {
        for (const unsubscribe of state.permanentUnsubscribers) unsubscribe();
        for (const model of state.models) model.setScroller(null);
    },
    scenarios,
    checks,
    annotations: {
        roots: [
            "../src/models",
            "../src/platform",
            "../src/benchmarks/privateFieldFixture.ts"
        ],
        relativeTo: "suite",
        requireTargets: true
    },
    options: {
        runtimes: ["node"],
        v8Tiers: ["turbofan"],
        modes: ["combined"],
        repetitions: 1,
        warmupIterations: 10_000,
        stressIterations: 2_000,
        deoptScope: "all"
    }
};
