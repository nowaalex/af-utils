import { describe, expect, test } from "vitest";

import { mapWithConcurrency } from "./concurrency.js";

describe("bounded concurrency", () => {
    test("caps active work and preserves input order", async () => {
        let active = 0;
        let maximumActive = 0;
        const results = await mapWithConcurrency(
            [30, 20, 10],
            2,
            async value => {
                active++;
                maximumActive = Math.max(maximumActive, active);
                await new Promise<void>(resolve => {
                    setTimeout(resolve, value);
                });
                active--;
                return value / 10;
            }
        );

        expect(maximumActive).toBe(2);
        expect(results).toEqual([3, 2, 1]);
    });

    test("accepts explicitly sequential execution", async () => {
        const results = await mapWithConcurrency([1, 2], 1, value =>
            Promise.resolve(value * 2)
        );

        expect(results).toEqual([2, 4]);
    });

    test.each([0, -1, 1.5, Number.NaN])(
        "rejects invalid concurrency %s",
        async concurrency => {
            await expect(
                mapWithConcurrency([], concurrency, () => Promise.resolve())
            ).rejects.toThrow("concurrency must be a positive integer");
        }
    );
});
