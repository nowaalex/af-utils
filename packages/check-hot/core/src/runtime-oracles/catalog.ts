import { problemDefinitions as jscCompilation } from "./jsc-compilation/problem.js";
import { problemDefinitions as v8Deoptimization } from "./v8-deoptimization/problem.js";
import { problemDefinitions as v8Tier } from "./v8-tier/problem.js";
import { problemDefinitions as workerLiveness } from "./worker-liveness/problem.js";
import { problemDefinitions as v8IcMaps } from "./v8-ic-maps/problem.js";
import { problemDefinitions as cpuHotness } from "./cpu-hotness/problem.js";
import { problemDefinitions as jscSampling } from "./jsc-sampling/problem.js";

/** Every engine/process problem definition owned by a runtime oracle. */
export const runtimeProblemDefinitions = [
    ...v8Deoptimization,
    ...v8Tier,
    ...jscCompilation,
    ...workerLiveness,
    ...v8IcMaps,
    ...cpuHotness,
    ...jscSampling
] as const;
