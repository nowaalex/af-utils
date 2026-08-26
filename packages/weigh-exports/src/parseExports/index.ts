type Exports = null | string | (string | ExportConditions)[] | ExportConditions;

type ExportConditions = {
    [condition: string]: Exports;
};

const ignoredConditions = new Set([
    "node",
    "deno",
    "electron",
    "development",
    "production",
    "react-native",
    "electron",
    "types"
]);

const exportsToGlobPatterns = (map: Exports): string[] => {
    switch (typeof map) {
        case "string":
            return map.startsWith(".")
                ? [map.endsWith("/") ? `${map}**` : map]
                : [];

        case "object":
            if (map === null) {
                return [];
            }
            return Array.isArray(map)
                ? map.flatMap(entry => exportsToGlobPatterns(entry))
                : Object.keys(map).flatMap(k =>
                      ignoredConditions.has(k)
                          ? []
                          : exportsToGlobPatterns(map[k])
                  );

        default:
            return [];
    }
};

export default exportsToGlobPatterns;
