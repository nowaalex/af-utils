/** Compatibility facade; implementations live beside their problem docs. */
export {
    checkV8Tier,
    classifyV8Tier,
    satisfiesRequestedV8Tier
} from "./runtime-oracles/v8-tier/check.js";
export {
    checkJscCompilation,
    classifyJscCompilation
} from "./runtime-oracles/jsc-compilation/check.js";
