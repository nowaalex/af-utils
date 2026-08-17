import type { HotMutationFamily } from "./types.js";

/** Error proving that an AST mutation cannot soundly use the supplied seed. */
export class HotMutationNotApplicableError extends Error {
    /** Construct a visible blocked-mutation explanation. */
    constructor(message: string) {
        super(message);
        this.name = "HotMutationNotApplicableError";
    }
}

/** Reject records whose descriptors or prototypes cannot be cloned faithfully. */
export const assertPlainRecordSeed: (
    value: unknown,
    family: HotMutationFamily
) => asserts value is Record<PropertyKey, unknown> = (value, family) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new HotMutationNotApplicableError(
            `${family} requires a plain record seed`
        );
    }
    const prototype = Object.getPrototypeOf(value) as unknown;
    if (prototype !== Object.prototype) {
        throw new HotMutationNotApplicableError(
            `${family} cannot safely clone a null-prototype, class, or built-in instance; provide an adapter-owned scenario`
        );
    }
    for (const key of Reflect.ownKeys(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (
            typeof key === "symbol" ||
            key === "__proto__" ||
            descriptor === undefined ||
            !descriptor.enumerable ||
            !descriptor.configurable ||
            "get" in descriptor ||
            "set" in descriptor ||
            !descriptor.writable
        ) {
            throw new HotMutationNotApplicableError(
                `${family} cannot safely clone symbols, __proto__, accessors, non-enumerable, readonly, or non-configurable fields; provide an adapter-owned scenario`
            );
        }
    }
};

/** Reject arrays whose holes, descriptors, prototype, or fields would be lost. */
export const assertSafeArraySeed: (
    value: unknown,
    family: HotMutationFamily
) => asserts value is unknown[] = (value, family) => {
    if (
        !Array.isArray(value) ||
        Object.getPrototypeOf(value) !== Array.prototype
    ) {
        throw new HotMutationNotApplicableError(
            `${family} requires an ordinary array seed`
        );
    }
    for (let index = 0; index < value.length; index++) {
        if (!Object.hasOwn(value, index)) {
            throw new HotMutationNotApplicableError(
                `${family} cannot safely clone a holey seed; provide an adapter-owned scenario`
            );
        }
    }
    for (const key of Reflect.ownKeys(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        const numericKey = typeof key === "string" ? Number(key) : NaN;
        const ordinaryIndex =
            typeof key === "string" &&
            Number.isInteger(numericKey) &&
            numericKey >= 0 &&
            String(numericKey) === key &&
            numericKey < value.length;
        const ordinaryLength = key === "length";
        if (
            typeof key === "symbol" ||
            (!ordinaryIndex && !ordinaryLength) ||
            !descriptor ||
            "get" in descriptor ||
            "set" in descriptor ||
            (ordinaryIndex &&
                (!descriptor.enumerable ||
                    !descriptor.configurable ||
                    !descriptor.writable)) ||
            (ordinaryLength && !descriptor.writable)
        ) {
            throw new HotMutationNotApplicableError(
                `${family} cannot safely clone array subclasses, extra fields, symbols, accessors, or constrained elements; provide an adapter-owned scenario`
            );
        }
    }
};
