import type { HotProblemOccurrence } from "../../problems/types.js";
import type { V8Tier } from "../../types.js";

/** Classify V8's currently attached tier from independent native intrinsics. */
export const classifyV8Tier = (observation: {
    /** `%ActiveTierIsMaglev` result. */
    maglev: boolean;
    /** `%ActiveTierIsTurbofan` result. */
    turbofan: boolean;
    /** Whether the raw status reports some optimized code. */
    optimized: boolean;
}): V8Tier | "none" | "other-optimized" => {
    if (observation.maglev) return "maglev";
    if (observation.turbofan) return "turbofan";
    return observation.optimized ? "other-optimized" : "none";
};

/** Require the exact requested tier rather than any optimized status bit. */
export const satisfiesRequestedV8Tier = (
    requested: V8Tier,
    active: ReturnType<typeof classifyV8Tier>
) => requested === active;

/** Produce a structured failure when the requested tier did not remain active. */
export const checkV8Tier = (
    targetId: string,
    requested: V8Tier,
    active: ReturnType<typeof classifyV8Tier>,
    status: number
): HotProblemOccurrence | undefined =>
    satisfiesRequestedV8Tier(requested, active)
        ? undefined
        : {
              problemId: "v8-tier-mismatch",
              targetId,
              message: `${targetId} requested ${requested}, but active tier is ${active} after guarded stress (status=${status})`
          };
