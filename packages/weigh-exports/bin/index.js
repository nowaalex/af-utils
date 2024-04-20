// src/index.ts
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { parseArgs } from "node:util";
import { existsSync } from "node:fs";
import { parse, join, normalize } from "node:path";

// src/getFileSizes/index.ts
import { promisify } from "node:util";
import { gzip as gzipCallback, brotliCompress } from "node:zlib";
import { minify } from "@swc/core";
var MINIFIER_OPTIONS = {
  module: true,
  compress: {
    global_defs: {
      "process.env.NODE_ENV": "production"
    }
  },
  format: {
    comments: false,
    preserve_annotations: false
  }
};
var gzip = promisify(gzipCallback);
var brotli = promisify(brotliCompress);
async function getFileSizes(code) {
  const { code: minifiedCode } = await minify(code, MINIFIER_OPTIONS);
  const [minifiedGzip, minifiedBrotli] = await Promise.all([
    gzip(minifiedCode),
    brotli(minifiedCode)
  ]);
  return {
    raw: code.length,
    min: minifiedCode.length,
    minGz: minifiedGzip.length,
    minBrotli: minifiedBrotli.length
  };
}
var getFileSizes_default = getFileSizes;

// src/parseExports/index.ts
var IgnoredConditions = [
  "node",
  "deno",
  "electron",
  "development",
  "react-native",
  "electron",
  "types"
];
var exportsToGlobPatterns = (map) => {
  switch (typeof map) {
    case "string":
      if (!map.startsWith(".")) {
        return [];
      }
      return [map.endsWith("/") ? `${map}**` : map];
    case "object":
      if (map === null) {
        return [];
      }
      return Array.isArray(map) ? map.flatMap(exportsToGlobPatterns) : Object.keys(map).flatMap(
        (k) => IgnoredConditions.includes(k) ? [] : exportsToGlobPatterns(map[k])
      );
    default:
      return [];
  }
};
var parseExports_default = exportsToGlobPatterns;

// src/index.ts
import chalk from "chalk";
var tStart = performance.now();
var { values } = parseArgs({
  options: {
    input: {
      type: "string",
      short: "i"
    },
    output: {
      type: "string",
      short: "o"
    },
    quiet: {
      type: "boolean",
      short: "q"
    }
  }
});
var parsedOutput = null;
var outputTsFile = "";
var packagePaths = [];
if (values.input) {
  packagePaths = values.input.trim().split(/\s+/).map(normalize);
}
if (!packagePaths.length) {
  throw Error("input must be provided");
}
if (values.output) {
  parsedOutput = await parse(values.output);
  outputTsFile = join(parsedOutput.dir, parsedOutput.name + ".ts");
}
var packageExports = [];
for (const path of packagePaths) {
  const pkgJsonPath = join(path, "package.json");
  if (existsSync(pkgJsonPath)) {
    const pkgJsonStr = await readFile(pkgJsonPath, { encoding: "utf-8" });
    const pkgJson = JSON.parse(pkgJsonStr);
    if (pkgJson.exports) {
      if (!pkgJson.name) {
        throw Error(
          `'name' field is missing for package json file: ${pkgJsonPath}`
        );
      }
      const globPatterns = parseExports_default(pkgJson.exports);
      const filteredExports = globPatterns.filter(
        (f) => /\.[cm]?js/.test(f)
      );
      const exports = await Promise.all(
        filteredExports.map(async (name) => {
          const fileContent = await readFile(join(path, name), {
            encoding: "utf-8"
          });
          const sizes = await getFileSizes_default(fileContent);
          return [name, sizes];
        })
      );
      packageExports.push([pkgJson.name, exports]);
    }
  }
}
if (!values.quiet) {
  for (const entry of packageExports) {
    console.log(chalk.bold(entry[0]));
    console.table(
      entry[1].map(([file, sizes]) => ({
        file,
        ...sizes
      }))
    );
  }
}
if (parsedOutput) {
  if (!existsSync(parsedOutput.dir)) {
    await mkdir(parsedOutput.dir, { recursive: true });
  }
  const jsonStr = JSON.stringify(
    Object.fromEntries(
      packageExports.map(([name, fileEntries]) => [
        name,
        Object.fromEntries(fileEntries)
      ])
    ),
    null,
    "	"
  );
  await writeFile(outputTsFile, `export default ${jsonStr} as const;`);
}
console.log(
  `Bundle sizes created in ${Math.round((performance.now() - tStart) * 100) / 100}ms`
);
