export function guardedNumeric(value, enabled = false) {
    if (enabled) return Number(value);
    return 0;
}
