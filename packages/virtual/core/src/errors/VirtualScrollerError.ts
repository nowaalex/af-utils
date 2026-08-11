import type { VirtualScrollerErrorCode } from "./codes";

/**
 * Error thrown for an invalid virtual-scroller operation.
 *
 * @remarks
 * The package's `development` export condition includes detailed diagnostic
 * messages. The default production export keeps only the stable short code so
 * consumer production bundles do not retain the diagnostic text.
 * @public
 */
export class VirtualScrollerError extends Error {
    /** Stable machine-readable error code. */
    readonly code: VirtualScrollerErrorCode;

    /** Create a package error with a stable machine-readable code. */
    constructor(code: VirtualScrollerErrorCode) {
        super(code);
        this.name = "VirtualScrollerError";
        this.code = code;
    }
}
