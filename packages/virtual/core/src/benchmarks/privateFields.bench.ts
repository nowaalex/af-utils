import { bench, describe } from "vitest";
import {
    NativePrivateState,
    type PrivateFieldState,
    TypeScriptPrivateState
} from "./privateFieldFixture";

const OPERATIONS_PER_SAMPLE = 100_000;
const INSTANCES_PER_VARIANT = 8;
const CONSTRUCTIONS_PER_SAMPLE = 1_000;
let benchmarkSink = 0.0;
let benchmarkObjectSink: PrivateFieldState[] = [];

const assertEquivalent = () => {
    const ordinary = new TypeScriptPrivateState(7);
    const native = new NativePrivateState(7);

    for (let input = 0; input < 10_000; input++) {
        const ordinaryResult = ordinary.step(input);
        const nativeResult = native.step(input);

        if (ordinaryResult !== nativeResult) {
            throw new Error(
                `Private-field fixtures diverged at input ${input}: ${ordinaryResult} !== ${nativeResult}`
            );
        }
    }
};

assertEquivalent();

const ordinaryState = new TypeScriptPrivateState(1);
const nativeState = new NativePrivateState(1);
const ordinaryStates: PrivateFieldState[] = Array.from(
    { length: INSTANCES_PER_VARIANT },
    (_, index) => new TypeScriptPrivateState(index)
);
const nativeStates: PrivateFieldState[] = Array.from(
    { length: INSTANCES_PER_VARIANT },
    (_, index) => new NativePrivateState(index)
);

describe("private fields: monomorphic hot loop", () => {
    bench("TypeScript private (ordinary properties)", () => {
        ordinaryState.reset(1);
        benchmarkSink = ordinaryState.run(OPERATIONS_PER_SAMPLE, 0);
    });

    bench("native #private", () => {
        nativeState.reset(1);
        benchmarkSink = nativeState.run(OPERATIONS_PER_SAMPLE, 0);
    });
});

describe("private fields: eight instances at one call site", () => {
    bench("TypeScript private (ordinary properties)", () => {
        let checksum = 0.0;

        for (let index = 0; index < INSTANCES_PER_VARIANT; index++) {
            ordinaryStates[index].reset(index);
        }

        for (
            let operation = 0;
            operation < OPERATIONS_PER_SAMPLE;
            operation++
        ) {
            checksum += ordinaryStates[operation & 7].step(operation);
        }

        benchmarkSink = checksum;
    });

    bench("native #private", () => {
        let checksum = 0.0;

        for (let index = 0; index < INSTANCES_PER_VARIANT; index++) {
            nativeStates[index].reset(index);
        }

        for (
            let operation = 0;
            operation < OPERATIONS_PER_SAMPLE;
            operation++
        ) {
            checksum += nativeStates[operation & 7].step(operation);
        }

        benchmarkSink = checksum;
    });
});

describe("private fields: construction", () => {
    bench("1k TypeScript-private instances", () => {
        // oxlint-disable-next-line unicorn/no-new-array -- Sparse preallocation is intentional in this allocation benchmark; Array.from would add fill work to the measurement.
        const instances = new Array<PrivateFieldState>(
            CONSTRUCTIONS_PER_SAMPLE
        );

        for (let index = 0; index < CONSTRUCTIONS_PER_SAMPLE; index++) {
            instances[index] = new TypeScriptPrivateState(index);
        }

        benchmarkObjectSink = instances;
        benchmarkSink = instances[CONSTRUCTIONS_PER_SAMPLE - 1].step(0);
    });

    bench("1k native-#private instances", () => {
        // oxlint-disable-next-line unicorn/no-new-array -- Sparse preallocation is intentional in this allocation benchmark; Array.from would add fill work to the measurement.
        const instances = new Array<PrivateFieldState>(
            CONSTRUCTIONS_PER_SAMPLE
        );

        for (let index = 0; index < CONSTRUCTIONS_PER_SAMPLE; index++) {
            instances[index] = new NativePrivateState(index);
        }

        benchmarkObjectSink = instances;
        benchmarkSink = instances[CONSTRUCTIONS_PER_SAMPLE - 1].step(0);
    });
});

void benchmarkSink;
void benchmarkObjectSink;
