import { expect, test } from "vitest";
import { getLiftingLimit, getLiftingLimitNaive } from ".";

test("matches the naive implementation across dense small ranges", () => {
    for (let rangeLength = 0; rangeLength < 64; rangeLength++) {
        for (let from = 0; from < 256; from++) {
            const to = from + rangeLength;
            expect(getLiftingLimit(from, to), `[${from} - ${to}]`).toBe(
                getLiftingLimitNaive(from, to)
            );
        }
    }
});

test("matches the naive implementation around 32-bit lifting boundaries", () => {
    const rangeLengths = [0, 1, 2, 3, 7, 15, 31, 32, 33, 63, 64, 65, 99];

    for (let bit = 1; bit < 30; bit++) {
        const boundary = 2 ** bit;
        for (let delta = -2; delta <= 2; delta++) {
            const from = boundary + delta;
            for (const rangeLength of rangeLengths) {
                const to = from + rangeLength;
                expect(getLiftingLimit(from, to), `[${from} - ${to}]`).toBe(
                    getLiftingLimitNaive(from, to)
                );
            }
        }
    }
});
