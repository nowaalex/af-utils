import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import {
    NativePrivateState,
    TypeScriptPrivateState
} from "../../../.jit/PrivateFieldFixture.mjs";
import {
    formatMarkdownTable,
    getEnvironmentDescription,
    writeBenchmarkReport
} from "../utils.mjs";

const outputPath = resolve(
    process.env.PRIVATE_NODE_BENCH_OUTPUT ??
        resolve(import.meta.dirname, "latest-node.md")
);

const OPERATIONS_PER_BATCH = 100_000;
const HOT_BATCHES_PER_ROUND = 20;
const INSTANCE_COUNT = 8;
const CONSTRUCTIONS_PER_BATCH = 1_000;
const CONSTRUCTION_BATCHES_PER_ROUND = 200;
const WARMUP_ROUNDS = 5;
const MEASURED_ROUNDS = 21;

let numericSink = 0.0;
let objectSink = [];

const median = values => {
    const sorted = values.toSorted((a, b) => a - b);
    return sorted[sorted.length >> 1];
};

const measureNanosecondsPerOperation = (work, operationCount) => {
    globalThis.gc?.();
    const start = performance.now();
    work();
    return ((performance.now() - start) * 1_000_000) / operationCount;
};

const ordinaryState = new TypeScriptPrivateState(1);
const nativeState = new NativePrivateState(1);
const ordinaryStates = Array.from(
    { length: INSTANCE_COUNT },
    (_, index) => new TypeScriptPrivateState(index)
);
const nativeStates = Array.from(
    { length: INSTANCE_COUNT },
    (_, index) => new NativePrivateState(index)
);

const runOrdinaryMonomorphic = () => {
    let checksum = 0.0;

    for (let batch = 0; batch < HOT_BATCHES_PER_ROUND; batch++) {
        ordinaryState.reset(1);
        checksum += ordinaryState.run(OPERATIONS_PER_BATCH, batch);
    }

    numericSink = checksum;
};

const runNativeMonomorphic = () => {
    let checksum = 0.0;

    for (let batch = 0; batch < HOT_BATCHES_PER_ROUND; batch++) {
        nativeState.reset(1);
        checksum += nativeState.run(OPERATIONS_PER_BATCH, batch);
    }

    numericSink = checksum;
};

const runOrdinaryMultipleInstances = () => {
    let checksum = 0.0;

    for (let batch = 0; batch < HOT_BATCHES_PER_ROUND; batch++) {
        for (let index = 0; index < INSTANCE_COUNT; index++) {
            ordinaryStates[index].reset(index);
        }

        for (let operation = 0; operation < OPERATIONS_PER_BATCH; operation++) {
            checksum += ordinaryStates[operation & 7].step(operation + batch);
        }
    }

    numericSink = checksum;
};

const runNativeMultipleInstances = () => {
    let checksum = 0.0;

    for (let batch = 0; batch < HOT_BATCHES_PER_ROUND; batch++) {
        for (let index = 0; index < INSTANCE_COUNT; index++) {
            nativeStates[index].reset(index);
        }

        for (let operation = 0; operation < OPERATIONS_PER_BATCH; operation++) {
            checksum += nativeStates[operation & 7].step(operation + batch);
        }
    }

    numericSink = checksum;
};

const runOrdinaryConstruction = () => {
    // oxlint-disable-next-line unicorn/no-new-array -- Sparse preallocation is intentional in this allocation benchmark; Array.from would add fill work to the measurement.
    const batches = new Array(CONSTRUCTION_BATCHES_PER_ROUND);

    for (let batch = 0; batch < CONSTRUCTION_BATCHES_PER_ROUND; batch++) {
        // oxlint-disable-next-line unicorn/no-new-array -- Sparse preallocation is intentional in this allocation benchmark; Array.from would add fill work to the measurement.
        const instances = new Array(CONSTRUCTIONS_PER_BATCH);

        for (let index = 0; index < CONSTRUCTIONS_PER_BATCH; index++) {
            instances[index] = new TypeScriptPrivateState(index);
        }

        batches[batch] = instances;
    }

    objectSink = batches;
};

const runNativeConstruction = () => {
    // oxlint-disable-next-line unicorn/no-new-array -- Sparse preallocation is intentional in this allocation benchmark; Array.from would add fill work to the measurement.
    const batches = new Array(CONSTRUCTION_BATCHES_PER_ROUND);

    for (let batch = 0; batch < CONSTRUCTION_BATCHES_PER_ROUND; batch++) {
        // oxlint-disable-next-line unicorn/no-new-array -- Sparse preallocation is intentional in this allocation benchmark; Array.from would add fill work to the measurement.
        const instances = new Array(CONSTRUCTIONS_PER_BATCH);

        for (let index = 0; index < CONSTRUCTIONS_PER_BATCH; index++) {
            instances[index] = new NativePrivateState(index);
        }

        batches[batch] = instances;
    }

    objectSink = batches;
};

const compare = ({ name, ordinary, native, operationCount }) => {
    for (let round = 0; round < WARMUP_ROUNDS; round++) {
        ordinary();
        native();
    }

    const ordinaryTimings = [];
    const nativeTimings = [];
    const pairedRatios = [];

    for (let round = 0; round < MEASURED_ROUNDS; round++) {
        let ordinaryTiming;
        let nativeTiming;

        if ((round & 1) === 0) {
            ordinaryTiming = measureNanosecondsPerOperation(
                ordinary,
                operationCount
            );
            nativeTiming = measureNanosecondsPerOperation(
                native,
                operationCount
            );
        } else {
            nativeTiming = measureNanosecondsPerOperation(
                native,
                operationCount
            );
            ordinaryTiming = measureNanosecondsPerOperation(
                ordinary,
                operationCount
            );
        }

        ordinaryTimings.push(ordinaryTiming);
        nativeTimings.push(nativeTiming);
        pairedRatios.push(nativeTiming / ordinaryTiming);
    }

    const ordinaryMedian = median(ordinaryTimings);
    const nativeMedian = median(nativeTimings);
    const pairedRatio = median(pairedRatios);

    return {
        scenario: name,
        "private ns/op": ordinaryMedian.toFixed(3),
        "#private ns/op": nativeMedian.toFixed(3),
        "#private delta": `${((pairedRatio - 1) * 100).toFixed(2)}%`
    };
};

const results = [
    compare({
        name: "monomorphic hot loop",
        ordinary: runOrdinaryMonomorphic,
        native: runNativeMonomorphic,
        operationCount: OPERATIONS_PER_BATCH * HOT_BATCHES_PER_ROUND
    }),
    compare({
        name: "eight instances",
        ordinary: runOrdinaryMultipleInstances,
        native: runNativeMultipleInstances,
        operationCount: OPERATIONS_PER_BATCH * HOT_BATCHES_PER_ROUND
    }),
    compare({
        name: "construction",
        ordinary: runOrdinaryConstruction,
        native: runNativeConstruction,
        operationCount: CONSTRUCTIONS_PER_BATCH * CONSTRUCTION_BATCHES_PER_ROUND
    })
];

console.table(results);

await writeBenchmarkReport(outputPath, [
    "# TypeScript private versus native private fields: Node",
    "",
    "<!-- Generated by pnpm nx run @af-utils/virtual-core:bench:private. Do not edit manually. -->",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Environment: ${getEnvironmentDescription()}`,
    "",
    `Runtime: ${process.version} / V8 ${process.versions.v8}`,
    "",
    "Lower timings are better. A positive delta means native `#private` is slower.",
    "",
    ...formatMarkdownTable(
        ["Scenario", "private, ns/op", "#private, ns/op", "#private delta"],
        results.map(result => [
            result.scenario,
            result["private ns/op"],
            result["#private ns/op"],
            result["#private delta"]
        ]),
        new Set([1, 2, 3])
    ),
    ""
]);

void numericSink;
void objectSink;
