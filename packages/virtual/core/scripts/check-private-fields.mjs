import {
    NativePrivateState,
    TypeScriptPrivateState
} from "../.jit/PrivateFieldFixture.mjs";

const OPTIMIZED_MASK = (1 << 4) | (1 << 5);

const assert = (condition, message) => {
    if (!condition) throw new Error(message);
};

// Complete V8 construction slack tracking before comparing representative maps.
const ordinaryInstances = Array.from(
    { length: 16 },
    (_, index) => new TypeScriptPrivateState(index)
);
const nativeInstances = Array.from(
    { length: 16 },
    (_, index) => new NativePrivateState(index)
);

assert(
    %HaveSameMap(ordinaryInstances[8], ordinaryInstances[15]),
    "TypeScript-private instances do not share one stable hidden class"
);
assert(
    %HaveSameMap(nativeInstances[8], nativeInstances[15]),
    "Native-#private instances do not share one stable hidden class"
);
assert(
    %HasFastProperties(ordinaryInstances[15]),
    "TypeScript-private instance uses dictionary properties"
);
assert(
    %HasFastProperties(nativeInstances[15]),
    "Native-#private instance uses dictionary properties"
);

const ordinaryStep = TypeScriptPrivateState.prototype.step;
const ordinaryRun = TypeScriptPrivateState.prototype.run;
const nativeStep = NativePrivateState.prototype.step;
const nativeRun = NativePrivateState.prototype.run;

for (const fn of [ordinaryStep, ordinaryRun, nativeStep, nativeRun]) {
    %PrepareFunctionForOptimization(fn);
}

for (let iteration = 0; iteration < 20_000; iteration++) {
    const ordinary = ordinaryInstances[iteration & 15];
    const native = nativeInstances[iteration & 15];

    ordinaryStep.call(ordinary, iteration);
    nativeStep.call(native, iteration);
}

ordinaryRun.call(ordinaryInstances[15], 20_000, 1);
nativeRun.call(nativeInstances[15], 20_000, 1);

for (const fn of [ordinaryStep, ordinaryRun, nativeStep, nativeRun]) {
    %OptimizeFunctionOnNextCall(fn);
}

ordinaryStep.call(ordinaryInstances[15], 1);
ordinaryRun.call(ordinaryInstances[15], 1, 1);
nativeStep.call(nativeInstances[15], 1);
nativeRun.call(nativeInstances[15], 1, 1);

const statuses = new Map([
    ["TypeScriptPrivateState.step", %GetOptimizationStatus(ordinaryStep)],
    ["TypeScriptPrivateState.run", %GetOptimizationStatus(ordinaryRun)],
    ["NativePrivateState.step", %GetOptimizationStatus(nativeStep)],
    ["NativePrivateState.run", %GetOptimizationStatus(nativeRun)]
]);

let failed = false;

for (const [name, status] of statuses) {
    const optimized = (status & OPTIMIZED_MASK) !== 0;
    console.log(`${name}: status=${status}, optimized=${optimized}`);
    failed ||= !optimized;
}

if (failed) {
    throw new Error("At least one private-field benchmark path was not optimized");
}

console.log(
    "TypeScript-private and native-#private instances retain fast, stable V8 properties"
);
