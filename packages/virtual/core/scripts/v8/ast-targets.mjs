import {
    NativePrivateState,
    TypeScriptPrivateState
} from "../../src/benchmarks/privateFieldFixture.ts";

// This module is bundled before analysis. The analyzer and runtime workers see
// the same immutable JavaScript bytes, so exact offsets need no source map.
export const nativePrivateStep = NativePrivateState.prototype.step;
export const typeScriptPrivateStep = TypeScriptPrivateState.prototype.step;

export { NativePrivateState, TypeScriptPrivateState };
