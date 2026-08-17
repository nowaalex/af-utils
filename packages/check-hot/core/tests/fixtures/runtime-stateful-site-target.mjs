let calls = 0;

export function statefulNumeric(value) {
    if (++calls <= 7) {
        const changed = value + 1;
        void changed;
        return value;
    }
    return value;
}
