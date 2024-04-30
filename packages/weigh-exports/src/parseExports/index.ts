type Exports = null | string | (string | ExportConditions)[] | ExportConditions;

type ExportConditions = {
    [condition: string]: Exports;
};

const IgnoredConditions = [
    "node",
    "deno",
    "electron",
    "development",
    "react-native",
    "electron",
    "types"
];

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
                ? map.flatMap(exportsToGlobPatterns)
                : Object.keys(map).flatMap(k =>
                      IgnoredConditions.includes(k)
                          ? []
                          : exportsToGlobPatterns(map[k])
                  );

        default:
            return [];
    }
};

export default exportsToGlobPatterns;
