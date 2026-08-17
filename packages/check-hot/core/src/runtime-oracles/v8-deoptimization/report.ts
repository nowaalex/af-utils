/** Stable information recoverable from V8's version-dependent trace text. */
export const parseV8Deoptimization = (line: string) => {
    const extractReason = (endMarker: string) => {
        const marker = "reason: ";
        const markerIndex = line.indexOf(marker);
        if (markerIndex === -1) return;
        const valueStart = markerIndex + marker.length;
        const valueEnd = line.indexOf(endMarker, valueStart);
        return valueEnd === -1 ? undefined : line.slice(valueStart, valueEnd);
    };
    const functionName =
        line.match(/JSFunction ((?:get |set )?[^ <()>]+)/u)?.[1] ??
        line.match(/SharedFunctionInfo ((?:get |set )?[^ <()>]+)/u)?.[1] ??
        (line.includes("<JSFunction <") ? "anonymous function" : undefined) ??
        "unknown function";
    const reason =
        extractReason("): begin") ??
        extractReason("]") ??
        (line.includes("dependent code")
            ? "dependent optimized code invalidated"
            : "unknown reason");
    return { functionName, reason };
};

/** Turn an engine-native reason into a bounded, actionable next step. */
export const explainV8Deoptimization = (reason: string) => {
    const normalized = reason.toLowerCase();
    if (normalized.includes("insufficient type feedback")) {
        return "A property, key, call, or value form first appeared during guarded stress. Warm every intended receiver/key/callback shape, then isolate scenarios to find the missing family.";
    }
    if (normalized.includes("wrong map")) {
        return "A receiver or loaded object had an unexpected hidden class. Compare construction order and optional fields, then add same-map/fast-properties checks around the responsible scenario.";
    }
    if (
        normalized.includes("not a smi") ||
        normalized.includes("lost precision") ||
        normalized.includes("overflow")
    ) {
        return "A numeric path changed representation. Warm integers, fractional doubles, zero, boundaries, and overflow behavior intentionally; verify array elements kinds where relevant.";
    }
    if (
        normalized.includes("wrong call target") ||
        normalized.includes("wrong feedback cell")
    ) {
        return "The call site observed a new function identity. Stabilize callbacks when appropriate or warm the intentional callback family in combined and isolated scenarios.";
    }
    if (
        normalized.includes("constness changed") ||
        normalized.includes("field type")
    ) {
        return "A field optimized as constant or as one representation changed later. Initialize fields consistently and include the intended write transition during warmup.";
    }
    if (normalized.includes("allocation site tenuring changed")) {
        return "Objects from an optimized allocation site survived differently during stress, so V8 changed its young/old-generation allocation policy. Increase representative warmup and test realistic object lifetimes; this can be GC-policy noise rather than a bad source pattern.";
    }
    if (normalized.includes("prototype")) {
        return "The prototype chain changed after optimization. Keep prototype mutation out of hot lifecycle phases or exercise it explicitly before optimization.";
    }
    return "Run the failing scenario in isolated mode with --verbose, then compare its warmup and stress receiver shapes, key types, callback identities, and numeric representations.";
};
