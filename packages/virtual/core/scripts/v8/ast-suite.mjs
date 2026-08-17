import { createModuleSuite } from "@af-utils/check-hot";

import {
    analysis,
    evidence,
    obligations
} from "../../.jit/ast-plan.mjs";

const targetUrl = new URL("../../.jit/ast-targets.mjs", import.meta.url).href;
let targetModule;

const initialSeed = 0;
const expectedStepResult = input => {
    const delta = (input & 15) - 7;
    const itemCount = (100_000 + (input & 1)) & 0x3fffffff;
    const from = (17 + (input & 1)) & 0xffff;
    const to = from + 32;
    const totalSize = 100_000 * 40.25 + 40.25 + delta * 0.25;
    let scrollOffset = 0.5 + delta;
    let direction = 1;
    if (scrollOffset < 0 || scrollOffset > 1_000_000) {
        direction = -direction;
        scrollOffset += delta * direction * 2;
    }
    const revision = 1;
    return (
        totalSize +
        scrollOffset +
        from +
        to +
        itemCount +
        revision +
        direction
    );
};

const verifyStepMutation = ({ args, result }) => {
    const input = args[0];
    if (typeof input !== "number" || result !== expectedStepResult(input)) {
        throw new Error(
            `private-state step returned ${String(result)} for ${String(input)}`
        );
    }
};

const samples = {
    nativePrivateStep: [
        {
            label: "fresh-native-private-state",
            args: () => [1.25],
            receiver: () => new targetModule.NativePrivateState(initialSeed),
            verifyMutation: verifyStepMutation
        }
    ],
    typeScriptPrivateStep: [
        {
            label: "fresh-typescript-private-state",
            args: () => [1.25],
            receiver: () =>
                new targetModule.TypeScriptPrivateState(initialSeed),
            verifyMutation: verifyStepMutation
        }
    ]
};

export default createModuleSuite({
    name: "@af-utils/virtual-core AST obligations",
    async load(resolvedUrl = targetUrl) {
        targetModule = await import(resolvedUrl);
        return targetModule;
    },
    resolve: () => targetUrl,
    samples,
    evidence,
    obligations,
    analysis,
    options: {
        runtimes: ["node"],
        v8Tiers: ["turbofan"],
        modes: ["combined"],
        repetitions: 1,
        warmupIterations: 10_000,
        stressIterations: 2_000,
        deoptScope: "targets"
    }
});
