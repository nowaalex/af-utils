import SizeIndex from "../.jit/SizeIndex.mjs";

globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const { default: VirtualScroller } = await import(
    "../.jit/VirtualScroller.mjs"
);
const { default: VirtualScrollerLayout } = await import(
    "../.jit/VirtualScrollerLayout.mjs"
);

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

const assertFastObject = (label, value) => {
    assert(
        %HasFastProperties(value),
        `${label} uses dictionary properties instead of V8 fast properties`
    );
    assert(
        !%HasDictionaryElements(value),
        `${label} uses dictionary elements for numeric keys`
    );
};

const getArrayElementsKind = value => {
    if (%HasSmiElements(value)) return "SMI";
    if (%HasDoubleElements(value)) return "DOUBLE";
    if (%HasObjectElements(value)) return "OBJECT";
    return "UNKNOWN";
};

const assertPackedArray = (label, value, expectedKind) => {
    assert(Array.isArray(value), `${label} is not an Array`);
    assert(%HasFastElements(value), `${label} does not use fast elements`);
    assert(
        %HasFastPackedElements(value),
        `${label} is not packed (elements kind: ${getArrayElementsKind(value)})`
    );
    assert(!%HasHoleyElements(value), `${label} unexpectedly contains holes`);
    assert(
        !%HasDictionaryElements(value),
        `${label} uses dictionary elements`
    );

    const kind = getArrayElementsKind(value);
    const matches = Array.isArray(expectedKind)
        ? expectedKind.includes(kind)
        : kind === expectedKind;
    assert(
        matches,
        `${label} uses ${kind} elements; expected ${Array.isArray(expectedKind) ? expectedKind.join(" or ") : expectedKind}`
    );
};

const assertTypedArray = (label, value, Constructor, length) => {
    assert(value instanceof Constructor, `${label} has the wrong typed-array type`);
    assert(ArrayBuffer.isView(value), `${label} is not an ArrayBuffer view`);
    assert(!Array.isArray(value), `${label} unexpectedly became a JS Array`);
    assert(value.length === length, `${label} has an unexpected length`);
    assert(value.byteOffset === 0, `${label} has a non-zero byte offset`);
    assert(
        value.byteLength === length * Constructor.BYTES_PER_ELEMENT,
        `${label} has an unexpected byte length`
    );
    assert(
        value.buffer.byteLength === value.byteLength,
        `${label} does not own its complete backing buffer`
    );
    assert(!value.buffer.resizable, `${label} uses a resizable ArrayBuffer`);
    assert(!value.buffer.detached, `${label} has a detached ArrayBuffer`);
};

const assertSmi = (label, value) => {
    assert(%IsSmi(value), `${label} is not represented as a V8 SMI`);
};

const assertFiniteDouble = (label, value) => {
    assert(
        typeof value === "number" && Number.isFinite(value),
        `${label} is not a finite number`
    );
    assert(!%IsSmi(value), `${label} did not exercise the double-number path`);
};

const createElementScroller = () => ({
    scrollTop: 0,
    scrollLeft: 0,
    clientHeight: 600,
    clientWidth: 600,
    clientTop: 0,
    clientLeft: 0,
    ownerDocument: { defaultView: null },
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect: () => ({ top: 0, left: 0 }),
    scroll(options) {
        if (options.top !== undefined) this.scrollTop = options.top;
        if (options.left !== undefined) this.scrollLeft = options.left;
    }
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
        scroll(options) {
            if (options.top !== undefined) this.scrollY = options.top;
            if (options.left !== undefined) this.scrollX = options.left;
        }
    };
    target.window = target;
    return target;
};

// Finish constructor slack tracking before auditing representative instances.
for (let iteration = 0; iteration < 8; iteration++) {
    new SizeIndex(20 + iteration);
    new VirtualScroller({ itemCount: iteration });
    new VirtualScrollerLayout(new VirtualScroller());
}

const sizeIndex = new SizeIndex(40.25);
sizeIndex._setCount(100_001);
sizeIndex._updateSize(50_000, 41.5, sizeIndex._getUpdateLimit(0, 100_001));

assertFastObject("SizeIndex", sizeIndex);
assertSmi("SizeIndex._count", sizeIndex._count);
assertSmi("SizeIndex._capacity", sizeIndex._capacity);
assertSmi("SizeIndex._mostSignificantBit", sizeIndex._mostSignificantBit);
assertFiniteDouble("SizeIndex._estimatedSize", sizeIndex._estimatedSize);
assertFiniteDouble("SizeIndex._totalSize", sizeIndex._totalSize);
assertFiniteDouble("SizeIndex._getOffset()", sizeIndex._getOffset(50_001));
assertSmi("SizeIndex._getIndex()", sizeIndex._getIndex(sizeIndex._totalSizeValue / 2));
assertTypedArray(
    "SizeIndex._sizes",
    sizeIndex._sizes,
    Float64Array,
    sizeIndex._capacityValue
);
assertTypedArray(
    "SizeIndex._tree",
    sizeIndex._tree,
    Float64Array,
    sizeIndex._capacityValue + 1
);
assert(
    sizeIndex._sizes.buffer !== sizeIndex._tree.buffer,
    "SizeIndex numeric arrays unexpectedly share a backing buffer"
);

const verticalModel = new VirtualScroller({
    estimatedItemSize: 40.25,
    estimatedWidgetSize: 600.5,
    itemCount: 100_001
});
const horizontalModel = new VirtualScroller({
    estimatedItemSize: 40.25,
    estimatedWidgetSize: 600.5,
    horizontal: true,
    itemCount: 100_001
});
const verticalWindowModel = new VirtualScroller({
    estimatedItemSize: 40.25,
    itemCount: 100_001
});
const horizontalWindowModel = new VirtualScroller({
    estimatedItemSize: 40.25,
    horizontal: true,
    itemCount: 100_001
});

for (const [label, model] of [
    ["VirtualScroller.vertical", verticalModel],
    ["VirtualScroller.horizontal", horizontalModel],
    ["VirtualScroller.verticalWindow", verticalWindowModel],
    ["VirtualScroller.horizontalWindow", horizontalWindowModel]
]) {
    assertFastObject(label, model);
    assertFastObject(`${label}._axisAdapter`, model._axisAdapter);
    assertFastObject(`${label}._events`, model._events);
    assertFastObject(`${label}._scrollActivity`, model._scrollActivity);
    assertFastObject(`${label}._sizeIndex`, model._sizeIndex);
    assertFastObject(`${label}._sticky`, model._sticky);
    assert(
        model._elementIndexes instanceof WeakMap,
        `${label}._elementIndexes is not a WeakMap`
    );
    assertPackedArray(
        `${label}._events._subscriptions`,
        model._events._subscriptions,
        "OBJECT"
    );
    assertPackedArray(
        `${label}._events._eventRevisions`,
        model._events._eventRevisions,
        "SMI"
    );
    assertSmi(`${label}._events._batchedEvents`, model._events._batchedEvents);
    assertSmi(`${label}._scrollActivity._flags`, model._scrollActivity._flags);
    assertPackedArray(`${label}._sticky._elements`, model._sticky._elements, "OBJECT");
    assertPackedArray(
        `${label}._sticky._sizes`,
        model._sticky._sizes,
        ["SMI", "DOUBLE"]
    );
}

assert(
    %HaveSameMap(verticalModel._axisAdapter, horizontalModel._axisAdapter),
    "Vertical and horizontal axis adapters do not share a hidden class"
);
assert(
    %HaveSameMap(verticalModel._events, horizontalModel._events),
    "VirtualScrollerEvents instances do not share a hidden class"
);
assert(
    %HaveSameMap(verticalModel._scrollActivity, horizontalModel._scrollActivity),
    "ScrollActivity instances do not share a hidden class"
);
assert(
    %HaveSameMap(verticalModel._sticky, horizontalModel._sticky),
    "StickyElements instances do not share a hidden class"
);

const unsubscribe = verticalModel.subscribe(() => {}, 1 | 2 | 4);
const subscription = verticalModel._events._subscriptions[0];
assertFastObject("VirtualScrollerEvents subscription", subscription);
verticalModel._events._emit(1);
unsubscribe();
verticalModel._sticky._sizes[0] = 0.5;

assertPackedArray(
    "VirtualScrollerEvents._subscriptions after unsubscribe",
    verticalModel._events._subscriptions,
    "OBJECT"
);
assertPackedArray(
    "VirtualScrollerEvents._eventRevisions after dispatch",
    verticalModel._events._eventRevisions,
    "SMI"
);
assertPackedArray(
    "StickyElements._sizes after fractional measurement",
    verticalModel._sticky._sizes,
    "DOUBLE"
);
assertSmi("VirtualScroller._itemCount", verticalModel._itemCount);
assertSmi("VirtualScroller._overscanCount", verticalModel._overscanCount);
assertSmi("VirtualScroller.from", verticalModel.from);
assertSmi("VirtualScroller.to", verticalModel.to);
assertSmi(
    "VirtualScrollerEvents._batchedEvents",
    verticalModel._events._batchedEvents
);
assertSmi("VirtualScrollerEvents._revision", verticalModel._events._revision);
assertFiniteDouble("VirtualScroller.scrollSize", verticalModel.scrollSize);
assertFiniteDouble(
    "VirtualScroller.getOffset()",
    verticalModel.getOffset(50_001)
);
assertSmi(
    "VirtualScroller.getIndex()",
    verticalModel.getIndex(verticalModel.scrollSize / 2)
);

verticalModel.setScroller(createElementScroller());
horizontalModel.setScroller(createElementScroller());
verticalWindowModel.setScroller(createWindowScroller());
horizontalWindowModel.setScroller(createWindowScroller());

for (const [label, model] of [
    ["ElementScrollerAdapter.vertical", verticalModel],
    ["ElementScrollerAdapter.horizontal", horizontalModel],
    ["WindowScrollerAdapter.vertical", verticalWindowModel],
    ["WindowScrollerAdapter.horizontal", horizontalWindowModel]
]) {
    assertFastObject(label, model._scrollerAdapter);
}

assert(
    %HaveSameMap(
        verticalModel._scrollerAdapter,
        horizontalModel._scrollerAdapter
    ),
    "Vertical and horizontal ElementScrollerAdapter instances do not share a hidden class"
);
assert(
    %HaveSameMap(
        verticalWindowModel._scrollerAdapter,
        horizontalWindowModel._scrollerAdapter
    ),
    "Vertical and horizontal WindowScrollerAdapter instances do not share a hidden class"
);
assert(
    !%HaveSameMap(
        verticalModel._scrollerAdapter,
        verticalWindowModel._scrollerAdapter
    ),
    "Element and window scroller adapters unexpectedly share one hidden class"
);

const layout = new VirtualScrollerLayout(verticalModel);
assertFastObject("VirtualScrollerLayout", layout);

if (process.argv.includes("--debug-print")) {
    console.log("\nV8 DebugPrint: SizeIndex");
    %DebugPrint(sizeIndex);
    console.log("\nV8 DebugPrint: VirtualScroller");
    %DebugPrint(verticalModel);
    console.log("\nV8 DebugPrint: VirtualScroller composed state");
    %DebugPrint(verticalModel._events);
    %DebugPrint(verticalModel._events._subscriptions);
    %DebugPrint(subscription);
    %DebugPrint(verticalModel._events._eventRevisions);
    %DebugPrint(verticalModel._scrollActivity);
    %DebugPrint(verticalModel._sticky);
    %DebugPrint(verticalModel._sticky._sizes);
    console.log("\nV8 DebugPrint: SizeIndex typed arrays");
    const inspectionIndex = new SizeIndex(40.25);
    inspectionIndex._setCount(4);
    %DebugPrint(inspectionIndex._sizes);
    %DebugPrint(inspectionIndex._tree);
}

verticalModel.setScroller(null);
horizontalModel.setScroller(null);
verticalWindowModel.setScroller(null);
horizontalWindowModel.setScroller(null);

console.log(
    "V8 representations are stable: fast objects, packed arrays, typed numeric storage, and expected SMI/double paths"
);
