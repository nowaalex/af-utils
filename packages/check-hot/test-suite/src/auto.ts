import type {
    HotModuleTestRunner,
    HotModuleTestRunnerContext
} from "@af-utils/check-hot";

import dateFnsTestRunner from "./date-fns.js";
import genericTestRunner from "./generic.js";
import lodashTestRunner from "./lodash.js";
import reactTestRunner from "./react.js";
import { testRunnerVersion } from "./shared.js";
import svelteTestRunner from "./svelte.js";
import threeTestRunner from "./three.js";

const selectTestRunner = (context: HotModuleTestRunnerContext) => {
    switch (context.package.name) {
        case "date-fns":
            return dateFnsTestRunner;
        case "lodash":
            return lodashTestRunner;
        case "react":
            return reactTestRunner;
        case "svelte":
            return svelteTestRunner;
        case "three":
            return threeTestRunner;
        default:
            return genericTestRunner;
    }
};

/** Auto-select a package-specific runner without coupling it to check-hot core. */
const automaticTestRunner: HotModuleTestRunner = {
    id: "ecosystem-auto",
    version: testRunnerVersion,
    coveragePolicy: "seed-only",
    discover(context) {
        return selectTestRunner(context).discover?.(context) ?? [];
    },
    validate(context) {
        return selectTestRunner(context).validate(context);
    },
    listSamples(context) {
        return selectTestRunner(context).listSamples(context);
    },
    perSampleTimeoutMs: 1_000,
    createSamples(context, selected) {
        return selectTestRunner(context).createSamples(context, selected);
    }
};

export default automaticTestRunner;
