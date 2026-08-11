import SizeIndex from "../.jit/SizeIndex.mjs";

globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};

const { default: VirtualScroller } = await import(
    "../.jit/VirtualScroller.mjs"
);
const { default: VirtualScrollerLayout } = await import(
    "../.jit/VirtualScrollerLayout.mjs"
);

// V8 reports optimized code through the Optimized and TurboFanned status bits.
// The exact combination differs between V8 releases (for example Maglev may
// transition a function to TurboFan without retaining the legacy bit).
const OPTIMIZED_MASK = (1 << 4) | (1 << 5);

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

const getOffset = SizeIndex.prototype._getOffset;
const getIndex = SizeIndex.prototype._getIndex;
const updateSize = SizeIndex.prototype._updateSize;

const warm = () => {
    const updateLimit = index._getUpdateLimit(100, 164);
    let totalDelta = 0.0;

    for (let iteration = 0; iteration < 20_000; iteration++) {
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

%PrepareFunctionForOptimization(getOffset);
%PrepareFunctionForOptimization(getIndex);
%PrepareFunctionForOptimization(updateSize);

warm();

%OptimizeFunctionOnNextCall(getOffset);
%OptimizeFunctionOnNextCall(getIndex);
%OptimizeFunctionOnNextCall(updateSize);

getOffset.call(index, 50_000);
getIndex.call(index, index._totalSizeValue / 2);
updateSize.call(index, 100, 42, index._getUpdateLimit(100, 164));

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
const verticalScroller = createScroller();
const horizontalScroller = createScroller();

verticalModel.setScroller(verticalScroller);
horizontalModel.setScroller(horizontalScroller);

if (!%HaveSameMap(verticalModel, horizontalModel)) {
    throw new Error(
        "Attaching different scroller modes changed the VirtualScroller hidden class"
    );
}

const virtualGetOffset = VirtualScroller.prototype.getOffset;
const virtualGetIndex = VirtualScroller.prototype.getIndex;
const setItemCount = VirtualScroller.prototype.setItemCount;
const syncScrollPosition = VirtualScroller.prototype._syncScrollPosition;
const subscribe = VirtualScroller.prototype.subscribe;
const getRevision = VirtualScroller.prototype.getRevision;
const applyMeasurements = VirtualScroller.prototype._applyMeasurements;

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
measurementModel._elementIndexes.set(measurementTarget, 0);
const eventDispatcher = measurementModel._events;
const eventPrototype = eventDispatcher.constructor.prototype;
const beginEventBatch = eventPrototype._beginBatch;
const emitEvent = eventPrototype._emit;
const endEventBatch = eventPrototype._endBatch;
const notifyEvent = eventPrototype._notify;
const scrollActivity = measurementModel._scrollActivity;
const scrollActivityPrototype = scrollActivity.constructor.prototype;
const onNativeScroll = scrollActivityPrototype._onNativeScroll;
const onNativeScrollEnd = scrollActivityPrototype._onNativeScrollEnd;
scrollActivity._setNativeScrollEndSupported(true);
const sticky = measurementModel._sticky;
const stickyResize = sticky.constructor.prototype._applyResizeEntries;
const stickyTarget = {};
const stickySize = { blockSize: 10, inlineSize: 10 };
const stickyEntries = [
    {
        target: stickyTarget,
        borderBoxSize: [stickySize]
    }
];
sticky._elements[0] = stickyTarget;
let eventSink = 0;
const eventCallback = () => eventSink++;

const warmEventsAndMeasurements = () => {
    for (let iteration = 0; iteration < 20_000; iteration++) {
        const unsubscribe = subscribe.call(
            measurementModel,
            eventCallback,
            1 | 2 | 4
        );
        beginEventBatch.call(eventDispatcher);
        emitEvent.call(eventDispatcher, 1);
        endEventBatch.call(eventDispatcher);
        getRevision.call(measurementModel, 1 | 2 | 4);
        unsubscribe();

        onNativeScroll.call(scrollActivity);
        onNativeScrollEnd.call(scrollActivity, false);

        stickySize.blockSize = 10 + (iteration & 1);
        stickyResize.call(sticky, stickyEntries);

        measurementSize.blockSize = 35 + (iteration % 11);
        applyMeasurements.call(measurementModel, measurementEntries);
    }
};

const warmVirtualScroller = () => {
    for (let iteration = 0; iteration < 20_000; iteration++) {
        const model = iteration & 1 ? verticalModel : horizontalModel;

        virtualGetOffset.call(model, iteration % 99_999);
        virtualGetIndex.call(model, (iteration * 97) % model.scrollSize);

        verticalScroller.scrollTop = (iteration * 193) % 3_999_400;
        horizontalScroller.scrollLeft = (iteration * 389) % 3_999_400;
        syncScrollPosition.call(model);

        if ((iteration & 31) === 0) {
            setItemCount.call(model, 99_999 + (iteration & 1));
        }
    }
};

%PrepareFunctionForOptimization(virtualGetOffset);
%PrepareFunctionForOptimization(virtualGetIndex);
%PrepareFunctionForOptimization(setItemCount);
%PrepareFunctionForOptimization(syncScrollPosition);
%PrepareFunctionForOptimization(subscribe);
%PrepareFunctionForOptimization(getRevision);
%PrepareFunctionForOptimization(beginEventBatch);
%PrepareFunctionForOptimization(emitEvent);
%PrepareFunctionForOptimization(endEventBatch);
%PrepareFunctionForOptimization(notifyEvent);
%PrepareFunctionForOptimization(onNativeScroll);
%PrepareFunctionForOptimization(onNativeScrollEnd);
%PrepareFunctionForOptimization(stickyResize);
%PrepareFunctionForOptimization(applyMeasurements);

warmVirtualScroller();
warmEventsAndMeasurements();

%OptimizeFunctionOnNextCall(virtualGetOffset);
%OptimizeFunctionOnNextCall(virtualGetIndex);
%OptimizeFunctionOnNextCall(setItemCount);
%OptimizeFunctionOnNextCall(syncScrollPosition);
%OptimizeFunctionOnNextCall(subscribe);
%OptimizeFunctionOnNextCall(getRevision);
%OptimizeFunctionOnNextCall(beginEventBatch);
%OptimizeFunctionOnNextCall(emitEvent);
%OptimizeFunctionOnNextCall(endEventBatch);
%OptimizeFunctionOnNextCall(notifyEvent);
%OptimizeFunctionOnNextCall(onNativeScroll);
%OptimizeFunctionOnNextCall(onNativeScrollEnd);
%OptimizeFunctionOnNextCall(stickyResize);
%OptimizeFunctionOnNextCall(applyMeasurements);

virtualGetOffset.call(verticalModel, 50_000);
virtualGetIndex.call(verticalModel, verticalModel.scrollSize / 2);
setItemCount.call(verticalModel, 100_000);
verticalScroller.scrollTop = 1_000_000;
syncScrollPosition.call(verticalModel);
horizontalScroller.scrollLeft = 1_000_000;
syncScrollPosition.call(horizontalModel);
const unsubscribe = subscribe.call(measurementModel, eventCallback, 1 | 2 | 4);
beginEventBatch.call(eventDispatcher);
emitEvent.call(eventDispatcher, 1);
endEventBatch.call(eventDispatcher);
notifyEvent.call(eventDispatcher, 1);
getRevision.call(measurementModel, 1 | 2 | 4);
unsubscribe();
onNativeScroll.call(scrollActivity);
onNativeScrollEnd.call(scrollActivity, false);
stickySize.blockSize = 12;
stickyResize.call(sticky, stickyEntries);
measurementSize.blockSize = 42;
applyMeasurements.call(measurementModel, measurementEntries);

const verticalLayout = new VirtualScrollerLayout(verticalModel);
const horizontalLayout = new VirtualScrollerLayout(horizontalModel);

if (!%HaveSameMap(verticalLayout, horizontalLayout)) {
    throw new Error(
        "VirtualScrollerLayout instances do not share the same V8 hidden class"
    );
}

const statuses = new Map([
    ["SizeIndex._getOffset", %GetOptimizationStatus(getOffset)],
    ["SizeIndex._getIndex", %GetOptimizationStatus(getIndex)],
    ["SizeIndex._updateSize", %GetOptimizationStatus(updateSize)],
    [
        "VirtualScroller.getOffset",
        %GetOptimizationStatus(virtualGetOffset)
    ],
    ["VirtualScroller.getIndex", %GetOptimizationStatus(virtualGetIndex)],
    [
        "VirtualScroller.setItemCount",
        %GetOptimizationStatus(setItemCount)
    ],
    [
        "VirtualScroller._syncScrollPosition",
        %GetOptimizationStatus(syncScrollPosition)
    ],
    ["VirtualScroller.subscribe", %GetOptimizationStatus(subscribe)],
    ["VirtualScroller.getRevision", %GetOptimizationStatus(getRevision)],
    ["VirtualScrollerEvents._beginBatch", %GetOptimizationStatus(beginEventBatch)],
    ["VirtualScrollerEvents._emit", %GetOptimizationStatus(emitEvent)],
    ["VirtualScrollerEvents._endBatch", %GetOptimizationStatus(endEventBatch)],
    ["VirtualScrollerEvents._notify", %GetOptimizationStatus(notifyEvent)],
    ["ScrollActivity._onNativeScroll", %GetOptimizationStatus(onNativeScroll)],
    [
        "ScrollActivity._onNativeScrollEnd",
        %GetOptimizationStatus(onNativeScrollEnd)
    ],
    [
        "StickyElements._applyResizeEntries",
        %GetOptimizationStatus(stickyResize)
    ],
    [
        "VirtualScroller._applyMeasurements",
        %GetOptimizationStatus(applyMeasurements)
    ]
]);

let failed = false;

for (const [name, status] of statuses) {
    const optimized = (status & OPTIMIZED_MASK) !== 0;
    console.log(`${name}: status=${status}, optimized=${optimized}`);
    failed ||= !optimized;
}

if (failed) {
    throw new Error(
        "At least one SizeIndex or VirtualScroller hot path was not optimized by V8"
    );
}
