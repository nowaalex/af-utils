import type { HotCheckObligation, HotPublicFunctionLocator } from "../types.js";

const validateSegment = (value: string, label: string) => {
    if (value.length === 0 || value.includes("\u0000")) {
        throw new Error(
            `${label} must be a non-empty string without NUL bytes`
        );
    }
};

/** Stable target key used by manifests, scenarios, and coverage ledgers. */
export const hotPublicTargetId = (target: HotPublicFunctionLocator) => {
    validateSegment(target.modulePath, "Public module path");
    if (target.exportPath.length === 0) {
        throw new Error("Public export path must contain at least one segment");
    }
    for (const segment of target.exportPath) {
        validateSegment(segment, "Public export path segment");
    }
    if (
        target.modulePath === "." &&
        target.exportPath.length === 1 &&
        !target.exportPath[0].includes("::")
    ) {
        return target.exportPath[0];
    }
    return `${target.modulePath}::${target.exportPath
        .map(segment => encodeURIComponent(segment))
        .join("/")}`;
};

/** Resolve an obligation's runtime target without parsing display names. */
export const hotObligationTargetId = (
    obligation: Pick<HotCheckObligation, "exportName" | "publicTarget">
) =>
    obligation.publicTarget
        ? hotPublicTargetId(obligation.publicTarget)
        : obligation.exportName;

/** Resolve a structured export without invoking accessors during discovery. */
export const resolveHotPublicFunction = (
    namespace: object,
    target: HotPublicFunctionLocator
) => {
    let owner: unknown = namespace;
    for (let index = 0; index < target.exportPath.length - 1; index++) {
        if (
            (typeof owner !== "object" && typeof owner !== "function") ||
            owner === null
        ) {
            return;
        }
        const descriptor = Object.getOwnPropertyDescriptor(
            owner,
            target.exportPath[index]
        );
        if (!descriptor || !("value" in descriptor)) return;
        owner = descriptor.value;
    }
    if (
        (typeof owner !== "object" && typeof owner !== "function") ||
        owner === null
    ) {
        return;
    }
    const name = target.exportPath.at(-1) as string;
    const descriptor = Object.getOwnPropertyDescriptor(owner, name);
    if (
        !descriptor ||
        !("value" in descriptor) ||
        typeof descriptor.value !== "function" ||
        /^class\s/u.test(Function.prototype.toString.call(descriptor.value))
    ) {
        return;
    }
    return { name, fn: descriptor.value as CallableFunction, receiver: owner };
};
