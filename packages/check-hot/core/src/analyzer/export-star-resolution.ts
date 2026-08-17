/** Local binding reached through an ESM export surface. */
export interface LocalExportOrigin {
    kind: "local";
    file: string;
    localName?: string;
    start: number;
    end: number;
}

/** Namespace object reached through an ESM export surface. */
export interface NamespaceExportOrigin {
    kind: "namespace";
    file: string;
}

/** Binding identity retained while resolving public exports. */
export type ExportOrigin = LocalExportOrigin | NamespaceExportOrigin;

const sameExportOrigin = (left: ExportOrigin, right: ExportOrigin) => {
    if (left.file !== right.file) return false;
    if (left.kind === "namespace") return right.kind === "namespace";
    const compared = right as LocalExportOrigin;
    return (
        left.localName === compared.localName &&
        left.start === compared.start &&
        left.end === compared.end
    );
};

/** Merge one `export *` surface using ESM ambiguity and explicit-name rules. */
export const mergeStarExportSurface = (
    surface: Map<string, ExportOrigin>,
    dependencySurface: ReadonlyMap<string, ExportOrigin>,
    explicitNames: ReadonlySet<string>,
    ambiguousNames: Set<string>
) => {
    for (const [name, origin] of dependencySurface) {
        if (
            name === "default" ||
            explicitNames.has(name) ||
            ambiguousNames.has(name)
        ) {
            continue;
        }
        const existing = surface.get(name);
        if (!existing) {
            surface.set(name, origin);
        } else if (!sameExportOrigin(existing, origin)) {
            surface.delete(name);
            ambiguousNames.add(name);
        }
    }
};
