import browserslistToEsbuild from "browserslist-to-esbuild";
import workspaceManifest from "../package.json" with { type: "json" };

if (!workspaceManifest.browserslist) {
    throw new TypeError("The workspace package.json must define browserslist");
}

export const browserslistQuery = workspaceManifest.browserslist;
export const browserBuildTarget = Object.freeze(
    browserslistToEsbuild(browserslistQuery)
);
