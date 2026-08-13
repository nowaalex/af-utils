import { expect } from "./fixture";

export function expectDefined<T>(
    value: T | null | undefined,
    message = "Expected value to be defined"
): T {
    expect(value, message).not.toBeNull();
    expect(value, message).not.toBeUndefined();
    if (value === null || value === undefined) throw new Error(message);
    return value;
}
