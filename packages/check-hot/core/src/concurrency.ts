/** Map independent work through a bounded pool while retaining input order. */
export const mapWithConcurrency = async <Input, Output>(
    values: readonly Input[],
    concurrency: number,
    run: (value: Input, index: number) => Promise<Output>
) => {
    if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
        throw new Error("concurrency must be a positive integer");
    }
    const results: Output[] = [];
    let nextIndex = 0;
    const consume = async () => {
        while (nextIndex < values.length) {
            const index = nextIndex++;
            // oxlint-disable-next-line no-await-in-loop -- One pool worker must finish its current item before claiming another.
            results[index] = await run(values[index], index);
        }
    };
    await Promise.all(
        Array.from({ length: Math.min(concurrency, values.length) }, consume)
    );
    return results;
};
