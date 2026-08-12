import type { MaybeAccessor } from "../types";

/** Read either a static primitive input or its reactive Solid accessor. */
const readAccessor = <Value>(value: MaybeAccessor<Value>): Value =>
    typeof value === "function" ? (value as () => Value)() : value;

export default readAccessor;
