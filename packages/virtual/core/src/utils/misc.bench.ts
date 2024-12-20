import { bench } from "vitest";
import { getLiftingLimit, getLiftingLimitNaive } from "./fTree";

const RANGE_LEN = 34;

bench("getLiftingLimit", () => {
    for (let i = 0; i < 10000; i++) {
        getLiftingLimit(i, i + RANGE_LEN);
    }
});

bench("getLiftingLimitNaive", () => {
    for (let i = 0; i < 10000; i++) {
        getLiftingLimitNaive(i, i + RANGE_LEN);
    }
});
