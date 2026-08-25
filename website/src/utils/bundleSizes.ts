export interface BundleSizeMeasurement {
    raw: number;
    min: number;
    minGz: number;
    minBrotli: number;
}

/** Add separately built payload measurements column by column. */
export const addBundleSizes = (
    left: BundleSizeMeasurement,
    right: BundleSizeMeasurement
): BundleSizeMeasurement => ({
    raw: left.raw + right.raw,
    min: left.min + right.min,
    minGz: left.minGz + right.minGz,
    minBrotli: left.minBrotli + right.minBrotli
});
