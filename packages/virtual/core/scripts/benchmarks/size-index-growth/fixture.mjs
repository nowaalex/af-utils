/** Run the capacity-growth comparison in the current JavaScript realm. */
export const runSizeIndexGrowthBenchmark = () => {
    const TARGET_CAPACITY = 1_000_000;
    const MIN_CAPACITY = 64;
    const ESTIMATED_SIZE = 40.25;
    const WARMUP_ROUNDS = 5;
    const MEASURED_ROUNDS = 21;
    const BATCHES_PER_ROUND = 16;
    const FLOAT64_BYTES = Float64Array.BYTES_PER_ELEMENT;

    if (
        typeof ArrayBuffer.prototype.transferToFixedLength !== "function" ||
        typeof ArrayBuffer.prototype.resize !== "function"
    ) {
        return {
            supported: false,
            reason: "ArrayBuffer transferToFixedLength or resize is unavailable"
        };
    }

    // oxlint-disable unicorn/consistent-function-scoping -- The exported benchmark is serialized into browser realms, so every helper must remain inside it.
    const getCapacities = () => {
        const capacities = [];
        let capacity = MIN_CAPACITY;

        while (capacity < TARGET_CAPACITY) {
            capacities.push(capacity);
            capacity = Math.min(TARGET_CAPACITY, Math.ceil((capacity * 3) / 2));
        }
        capacities.push(TARGET_CAPACITY);
        return capacities;
    };

    const median = values => {
        const sorted = values.toSorted((a, b) => a - b);
        return sorted[sorted.length >> 1];
    };

    const capacities = getCapacities();
    const getChecksum = sizes => {
        let checksum = sizes.length;
        for (const capacity of capacities) {
            checksum += sizes[capacity - 1];
        }
        return checksum;
    };

    const growAllocatedSizes = () => {
        let sizes = new Float64Array(0);

        for (const capacity of capacities) {
            const nextSizes = new Float64Array(capacity);
            nextSizes.fill(ESTIMATED_SIZE);
            nextSizes.set(sizes);
            sizes = nextSizes;
            sizes[capacity - 1] = capacity + 0.5;
        }

        return getChecksum(sizes);
    };

    const growTransferredSizes = () => {
        let sizes = new Float64Array(0);
        let oldCapacity = 0;

        for (const capacity of capacities) {
            sizes =
                sizes.length === 0
                    ? new Float64Array(capacity)
                    : new Float64Array(
                          sizes.buffer.transferToFixedLength(
                              capacity * FLOAT64_BYTES
                          )
                      );
            sizes.fill(ESTIMATED_SIZE, oldCapacity);
            sizes[capacity - 1] = capacity + 0.5;
            oldCapacity = capacity;
        }

        return getChecksum(sizes);
    };

    const growResizableSizes = () => {
        const buffer = new ArrayBuffer(0, {
            maxByteLength: TARGET_CAPACITY * FLOAT64_BYTES
        });
        const sizes = new Float64Array(buffer);
        let oldCapacity = 0;

        for (const capacity of capacities) {
            buffer.resize(capacity * FLOAT64_BYTES);
            sizes.fill(ESTIMATED_SIZE, oldCapacity);
            sizes[capacity - 1] = capacity + 0.5;
            oldCapacity = capacity;
        }

        return getChecksum(sizes);
    };

    const compare = strategies => {
        const expectedChecksum = strategies[0].run();
        for (const strategy of strategies) {
            if (strategy.run() !== expectedChecksum) {
                throw new Error(`${strategy.name} produced different data`);
            }
        }

        for (let round = 0; round < WARMUP_ROUNDS; round++) {
            for (const strategy of strategies) strategy.run();
        }

        const timings = Object.fromEntries(
            strategies.map(strategy => [strategy.name, []])
        );
        let checksum = 0;

        for (let round = 0; round < MEASURED_ROUNDS; round++) {
            for (let offset = 0; offset < strategies.length; offset++) {
                const strategy =
                    strategies[(round + offset) % strategies.length];
                const start = performance.now();
                for (let batch = 0; batch < BATCHES_PER_ROUND; batch++) {
                    checksum += strategy.run();
                }
                timings[strategy.name].push(
                    (performance.now() - start) / BATCHES_PER_ROUND
                );
            }
        }

        return {
            allocateMilliseconds: median(timings.allocate),
            resizeMilliseconds: median(timings.resize),
            transferMilliseconds: median(timings.transfer)
        };
    };
    // oxlint-enable unicorn/consistent-function-scoping

    const sizeStrategies = [
        { name: "allocate", run: growAllocatedSizes },
        { name: "transfer", run: growTransferredSizes },
        { name: "resize", run: growResizableSizes }
    ];
    const result = compare(sizeStrategies);

    return {
        supported: true,
        growthSteps: capacities.length,
        measuredRounds: MEASURED_ROUNDS,
        targetCapacity: TARGET_CAPACITY,
        result
    };
};
