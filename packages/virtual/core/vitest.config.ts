import codspeedPlugin from "@codspeed/vitest-plugin";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [codspeedPlugin()],
    resolve: {
        tsconfigPaths: true
    },
    test: {
        exclude: [...configDefaults.exclude, "**/.stryker-tmp/**"]
    }
});
