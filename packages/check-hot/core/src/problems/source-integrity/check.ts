import { HotProblemError } from "../error.js";

/** Stop a proof when authenticated bytes changed after analysis or probing. */
export const sourceIntegrityFailure = (message: string) =>
    new HotProblemError("source-integrity-mismatch", message);

/** Stop a proof when the runtime selected a different public artifact. */
export const runtimeResolutionFailure = (message: string) =>
    new HotProblemError("runtime-resolution-mismatch", message);
