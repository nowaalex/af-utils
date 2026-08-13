import SizeIndex from "../../.jit/SizeIndex.mjs";
import { HOT_PATHS, resolveHotPaths } from "./hot-paths.mjs";

globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};
globalThis.window = {
    addEventListener() {},
    removeEventListener() {}
};
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};

const { default: VirtualScroller } = await import(
    "../../.jit/VirtualScroller.mjs"
);
const { default: VirtualScrollerLayout } = await import(
    "../../.jit/VirtualScrollerLayout.mjs"
);

// V8 reports optimized code through the Optimized and TurboFanned status bits.
// The exact combination differs between V8 releases (for example Maglev may
// transition a function to TurboFan without retaining the legacy bit).
const OPTIMIZED_MASK = (1 << 4) | (1 << 5);
const WARMUP_ITERATIONS = 20_000;
const STRESS_ITERATIONS = 5_000;

// Finish construction slack tracking before comparing maps. Otherwise this
// script only validates V8's temporary, over-allocated constructor map.
for (let iteration = 0; iteration < 8; iteration++) {
    new SizeIndex(20 + iteration);
}

const index = new SizeIndex(40);
index._setCount(100_000);

const emptyIndex = new SizeIndex(20);
const smallIndex = new SizeIndex(30);
smallIndex._setCount(10);

if (!%HaveSameMap(index, emptyIndex) || !%HaveSameMap(index, smallIndex)) {
    throw new Error(
        "SizeIndex instances do not share the same V8 hidden class"
    );
}

console.log(
    "SizeIndex hidden class is stable across empty and grown instances"
);

// V8 intentionally changes the initial map while construction slack tracking
// is active. Finish that phase before comparing representative instances.
for (let iteration = 0; iteration < 8; iteration++) {
    new VirtualScroller({ itemCount: iteration });
}

const defaultModel = new VirtualScroller();
const verticalModel = new VirtualScroller({
    estimatedItemSize: 40,
    estimatedWidgetSize: 600,
    itemCount: 100_000
});
const horizontalModel = new VirtualScroller({
    estimatedItemSize: 40,
    estimatedWidgetSize: 600,
    horizontal: true,
    itemCount: 100_000
});
const virtualScrollerMaps = {
    defaultVertical: %HaveSameMap(defaultModel, verticalModel),
    defaultHorizontal: %HaveSameMap(defaultModel, horizontalModel),
    verticalHorizontal: %HaveSameMap(verticalModel, horizontalModel)
};

console.log("VirtualScroller map comparison", virtualScrollerMaps);

if (
    !virtualScrollerMaps.defaultVertical ||
    !virtualScrollerMaps.defaultHorizontal
) {
    throw new Error(
        "VirtualScroller instances do not share the same V8 hidden class"
    );
}

console.log(
    "VirtualScroller hidden class is stable across empty, vertical and horizontal instances"
);

const createScroller = () => ({
    scrollTop: 0,
    scrollLeft: 0,
    clientHeight: 600,
    clientWidth: 600,
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect: () => ({ top: 0, left: 0 }),
    scroll() {}
});
const createWindowScroller = () => {
    const target = {
        window: null,
        scrollY: 0,
        scrollX: 0,
        innerHeight: 600,
        innerWidth: 600,
        document: {
            documentElement: { clientHeight: 600, clientWidth: 600 }
        },
        addEventListener() {},
        removeEventListener() {},
        scroll() {}
    };
    target.window = target;
    return target;
};

const verticalScroller = createScroller();
const horizontalScroller = createScroller();
const windowScroller = createWindowScroller();
const windowModel = new VirtualScroller({
    estimatedItemSize: 40,
    estimatedWidgetSize: 600,
    itemCount: 100_000
});

verticalModel.setScroller(verticalScroller);
horizontalModel.setScroller(horizontalScroller);
windowModel.setScroller(windowScroller);

if (
    !%HaveSameMap(defaultModel, verticalModel) ||
    !%HaveSameMap(verticalModel, horizontalModel) ||
    !%HaveSameMap(verticalModel, windowModel)
) {
    throw new Error(
        "Attaching element or window scrollers changed the VirtualScroller hidden class"
    );
}

console.log(
    "VirtualScroller hidden class is stable across detached, element and window scrollers"
);

const measurementModel = new VirtualScroller({
    estimatedItemSize: 40,
    itemCount: 1_000
});
const measurementTarget = {};
const measurementSize = { blockSize: 41, inlineSize: 41 };
const measurementEntries = [
    {
        target: measurementTarget,
        borderBoxSize: [measurementSize]
    }
];
measurementModel._items._elementIndexes.set(measurementTarget, 0);

const eventDispatcher = measurementModel._events;
const scrollActivity = measurementModel._scrollActivity;
scrollActivity._setNativeScrollEndSupported(true);

const sticky = measurementModel._sticky;
const stickyTarget = {};
const stickySize = { blockSize: 10, inlineSize: 10 };
const stickyEntries = [
    {
        target: stickyTarget,
        borderBoxSize: [stickySize]
    }
];
sticky._elements[0] = stickyTarget;

const verticalLayout = new VirtualScrollerLayout(verticalModel);
const horizontalLayout = new VirtualScrollerLayout(horizontalModel);
verticalLayout._itemsElement = { style: {} };

const hotPaths = resolveHotPaths(HOT_PATHS, {
    SizeIndex: SizeIndex.prototype,
    VirtualScroller: VirtualScroller.prototype,
    VirtualScrollerEvents: eventDispatcher.constructor.prototype,
    ScrollActivity: scrollActivity.constructor.prototype,
    StickyElements: sticky.constructor.prototype,
    // _applyItemsGeometry is an instance callback field, not a prototype method.
    VirtualScrollerLayout: verticalLayout
});
const {
    sizeIndexGetOffset: getOffset,
    sizeIndexGetIndex: getIndex,
    sizeIndexUpdateSize: updateSize,
    virtualScrollerGetOffset: virtualGetOffset,
    virtualScrollerGetIndex: virtualGetIndex,
    virtualScrollerSetItemCount: setItemCount,
    virtualScrollerSyncScrollPosition: syncScrollPosition,
    virtualScrollerSubscribe: subscribe,
    virtualScrollerGetRevision: getRevision,
    virtualScrollerApplyMeasurements: applyMeasurements,
    eventsBeginBatch: beginEventBatch,
    eventsEmit: emitEvent,
    eventsEndBatch: endEventBatch,
    eventsNotify: notifyEvent,
    scrollActivityOnNativeScroll: onNativeScroll,
    scrollActivityOnNativeScrollEnd: onNativeScrollEnd,
    stickyApplyResizeEntries: stickyResize,
    layoutApplyItemsGeometry: applyItemsGeometry
} = hotPaths.methods;

let eventSink = 0;
const eventCallback = () => eventSink++;

const exerciseSizeIndex = (iterations) => {
    const updateLimit = index._getUpdateLimit(100, 164);
    let totalDelta = 0.0;

    for (let iteration = 0; iteration < iterations; iteration++) {
        getOffset.call(index, iteration % 100_000);
        getIndex.call(index, (iteration * 97) % index._totalSizeValue);
        totalDelta += updateSize.call(
            index,
            100 + (iteration % 64),
            35 + (iteration % 11),
            updateLimit
        );
    }

    index._completeUpdateBatch(updateLimit, totalDelta);
};

const exerciseVirtualScroller = (iterations) => {
    for (let iteration = 0; iteration < iterations; iteration++) {
        const mode = iteration % 3;
        const model =
            mode === 0
                ? verticalModel
                : mode === 1
                  ? horizontalModel
                  : windowModel;

        virtualGetOffset.call(model, iteration % 99_999);
        virtualGetIndex.call(model, (iteration * 97) % model.scrollSize);

        verticalScroller.scrollTop = (iteration * 193) % 3_999_400;
        horizontalScroller.scrollLeft = (iteration * 389) % 3_999_400;
        windowScroller.scrollY = (iteration * 587) % 3_999_400;
        syncScrollPosition.call(model);

        if ((iteration & 31) === 0) {
            setItemCount.call(model, 99_999 + (iteration & 1));
        }
    }
};

const exerciseEventsAndMeasurements = (iterations) => {
    for (let iteration = 0; iteration < iterations; iteration++) {
        const unsubscribe = subscribe.call(
            measurementModel,
            eventCallback,
            1 | 2 | 4
        );
        beginEventBatch.call(eventDispatcher);
        emitEvent.call(eventDispatcher, 1);
        endEventBatch.call(eventDispatcher);
        notifyEvent.call(eventDispatcher, 1);
        getRevision.call(measurementModel, 1 | 2 | 4);
        unsubscribe();

        onNativeScroll.call(scrollActivity);
        onNativeScrollEnd.call(scrollActivity);

        stickySize.blockSize = 10 + (iteration & 1);
        stickyResize.call(sticky, stickyEntries);

        measurementSize.blockSize = 35 + (iteration % 11);
        applyMeasurements.call(measurementModel, measurementEntries);
    }
};

const exerciseLayout = (iterations) => {
    for (let iteration = 0; iteration < iterations; iteration++) {
        applyItemsGeometry();
    }
};

// Harness loops are deliberately never optimized: their OSR/deopts otherwise
// pollute --trace-deopt and can be confused with the guarded library methods.
for (const harness of [
    exerciseSizeIndex,
    exerciseVirtualScroller,
    exerciseEventsAndMeasurements,
    exerciseLayout
]) {
    %NeverOptimizeFunction(harness);
}

for (const { fn } of hotPaths.entries) {
    %PrepareFunctionForOptimization(fn);
}

exerciseSizeIndex(WARMUP_ITERATIONS);
exerciseVirtualScroller(WARMUP_ITERATIONS);
exerciseEventsAndMeasurements(WARMUP_ITERATIONS);
exerciseLayout(WARMUP_ITERATIONS);

for (const { fn } of hotPaths.entries) {
    %OptimizeFunctionOnNextCall(fn);
}

// Exercise all supported receiver and data shapes after optimization. A final
// status check alone is insufficient because a method could deopt and reopt.
exerciseSizeIndex(STRESS_ITERATIONS);
exerciseVirtualScroller(STRESS_ITERATIONS);
exerciseEventsAndMeasurements(STRESS_ITERATIONS);
exerciseLayout(STRESS_ITERATIONS);

if (!%HaveSameMap(verticalLayout, horizontalLayout)) {
    throw new Error(
        "VirtualScrollerLayout instances do not share the same V8 hidden class"
    );
}

let failed = false;

for (const { label, fn } of hotPaths.entries) {
    const status = %GetOptimizationStatus(fn);
    const optimized = (status & OPTIMIZED_MASK) !== 0;
    console.log(`${label}: status=${status}, optimized=${optimized}`);
    failed ||= !optimized;
}

if (failed) {
    throw new Error(
        "At least one SizeIndex or VirtualScroller hot path was not optimized by V8"
    );
}

console.log(`V8 hot-path sink: ${eventSink}`);
