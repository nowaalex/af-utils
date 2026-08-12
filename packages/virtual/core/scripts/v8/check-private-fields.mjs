import {
    NativePrivateState,
    TypeScriptPrivateState
} from "../../.jit/PrivateFieldFixture.mjs";
import { PRIVATE_FIELD_HOT_PATHS, resolveHotPaths } from "./hot-paths.mjs";

const OPTIMIZED_MASK = (1 << 4) | (1 << 5);
const WARMUP_ITERATIONS = 20_000;
const STRESS_ITERATIONS = 5_000;

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

const hotPaths = resolveHotPaths(PRIVATE_FIELD_HOT_PATHS, {
    TypeScriptPrivateState: TypeScriptPrivateState.prototype,
    NativePrivateState: NativePrivateState.prototype
});
const {
    typescriptPrivateStep: ordinaryStep,
    typescriptPrivateRun: ordinaryRun,
    nativePrivateStep: nativeStep,
    nativePrivateRun: nativeRun
} = hotPaths.methods;

const exercisePrivateFields = (iterations) => {
    for (let iteration = 0; iteration < iterations; iteration++) {
        const ordinary = ordinaryInstances[iteration & 15];
        const native = nativeInstances[iteration & 15];

        ordinaryStep.call(ordinary, iteration);
        nativeStep.call(native, iteration);
    }

    ordinaryRun.call(ordinaryInstances[15], iterations, 1);
    nativeRun.call(nativeInstances[15], iterations, 1);
};

%NeverOptimizeFunction(exercisePrivateFields);

for (const { fn } of hotPaths.entries) {
    %PrepareFunctionForOptimization(fn);
}

exercisePrivateFields(WARMUP_ITERATIONS);

for (const { fn } of hotPaths.entries) {
    %OptimizeFunctionOnNextCall(fn);
}

exercisePrivateFields(STRESS_ITERATIONS);

let failed = false;

for (const { label, fn } of hotPaths.entries) {
    const status = %GetOptimizationStatus(fn);
    const optimized = (status & OPTIMIZED_MASK) !== 0;
    console.log(`${label}: status=${status}, optimized=${optimized}`);
    failed ||= !optimized;
}

if (failed) {
    throw new Error("At least one private-field benchmark path was not optimized");
}

console.log(
    "TypeScript-private and native-#private instances retain fast, stable V8 properties"
);
