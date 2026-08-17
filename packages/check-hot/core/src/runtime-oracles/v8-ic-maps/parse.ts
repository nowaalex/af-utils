import type {
    HotRuntimeEvent,
    HotV8CodeCreationLocation,
    HotV8InlineCacheTransition,
    HotV8LogSummary,
    HotV8MapEdge,
    HotV8MapNode
} from "../../types.js";

const icKinds = new Set([
    "LoadIC",
    "StoreIC",
    "KeyedLoadIC",
    "KeyedStoreIC",
    "LoadGlobalIC",
    "StoreGlobalIC"
]);

const hasV8SourceIntent = (target: HotV8TargetDescriptor) =>
    target.sourceFile !== undefined;

/** Exact V8 fingerprints whose code-event/IC layout has a real engine control. */
export const supportedV8LogLayouts = [
    {
        engineVersionPattern: /^11\.3\.244\.8-node\.\d+$/u,
        engineVersionRange: "11.3.244.8-node.<numeric build>",
        platform: "linux",
        layout: "v8-code-events-ic-maps-v1",
        control: "ci-node-20.19-runtime-workers",
        locationControl: "ci-node-20.19-v8-code-creation-locators"
    },
    {
        engineVersionPattern: /^13\.6\.233\.17-node\.\d+$/u,
        engineVersionRange: "13.6.233.17-node.<numeric build>",
        platform: "linux",
        layout: "v8-code-events-ic-maps-v1",
        control: "ci-node-24.19-runtime-workers",
        locationControl: "ci-node-24.19-v8-code-creation-locators"
    },
    {
        engineVersion: "14.6.202.34-node.28",
        platform: "linux",
        layout: "v8-code-events-ic-maps-v1",
        control: "node-26.7.0-runtime-workers",
        locationControl: "node-26.7.0-v8-code-creation-locators"
    },
    {
        engineVersion: "15.0.245.2-rusty",
        platform: "linux",
        layout: "v8-code-events-ic-maps-v1",
        control: "deno-2.9.5-runtime-workers",
        locationControl: "deno-2.9.5-v8-code-creation-locators"
    }
] as const;

/** Exact syntax/modifier tuples exercised by every registered locator control. */
export const supportedV8CodeCreationLocationTuples: ReadonlySet<string> =
    new Set([
        "FunctionDeclaration:parameter-list-start:false:false:false:false",
        "FunctionDeclaration:parameter-list-start:false:true:false:false",
        "FunctionDeclaration:parameter-list-start:true:false:false:false",
        "FunctionDeclaration:parameter-list-start:true:true:false:false",
        "FunctionExpression:parameter-list-start:false:false:false:false",
        "FunctionExpression:parameter-list-start:false:true:false:false",
        "FunctionExpression:parameter-list-start:true:false:false:false",
        "FunctionExpression:parameter-list-start:true:true:false:false",
        "ArrowFunctionExpression:parameter-list-start:false:false:false:false",
        "ArrowFunctionExpression:parameter-start:false:false:false:false",
        "ArrowFunctionExpression:async-keyword-start:true:false:false:false",
        "ObjectMethod:parameter-list-start:false:false:false:false",
        "ObjectMethod:parameter-list-start:false:true:false:false",
        "ObjectMethod:parameter-list-start:true:false:false:false",
        "ObjectMethod:parameter-list-start:true:true:false:false",
        "ObjectMethod:parameter-list-start:false:false:false:true",
        "ObjectGetter:parameter-list-start:false:false:false:false",
        "ObjectSetter:parameter-list-start:false:false:false:false",
        "ClassMethod:parameter-list-start:false:false:false:false",
        "ClassMethod:parameter-list-start:false:true:false:false",
        "ClassMethod:parameter-list-start:true:false:false:false",
        "ClassMethod:parameter-list-start:true:true:false:false",
        "ClassMethod:parameter-list-start:false:false:false:true",
        "ClassMethod:parameter-list-start:false:false:true:false",
        "ClassGetter:parameter-list-start:false:false:false:false",
        "ClassSetter:parameter-list-start:false:false:false:false"
    ]);

const v8CodeCreationLocationTuple = (location: HotV8CodeCreationLocation) =>
    [
        location.syntaxKind,
        location.anchor,
        location.async,
        location.generator,
        location.static,
        location.computed
    ].join(":");

/** Parse one finite numeric V8 field without accepting empty/invalid data. */
export const parseV8NumericField = (value?: string) => {
    if (value === undefined || value.length === 0) return;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

/** Iterate a possibly large V8 log without allocating a full line array. */
export function* iterateV8LogLines(value: string) {
    let start = 0;
    while (start <= value.length) {
        const newline = value.indexOf("\n", start);
        const end = newline < 0 ? value.length : newline;
        const lineEnd = end > start && value[end - 1] === "\r" ? end - 1 : end;
        yield value.slice(start, lineEnd);
        if (newline < 0) return;
        start = newline + 1;
    }
}

/** One runtime-owned function identity used to scope a process-global V8 log. */
export interface HotV8TargetDescriptor {
    targetId: string;
    functionName: string;
    sourceFile?: string;
    runtimeLocation?: HotV8CodeCreationLocation;
}

interface TargetRange extends HotV8TargetDescriptor {
    start: bigint;
    end: bigint;
    correlation: "target" | "name-only";
}

/** Normalize a file URL or platform path emitted in a V8 code record. */
export const normalizeV8SourceFile = (value: string) => {
    if (value.startsWith("file:")) {
        try {
            return decodeURIComponent(new URL(value).pathname).replaceAll(
                "\\",
                "/"
            );
        } catch {
            return value.replaceAll("\\", "/");
        }
    }
    return value.replaceAll("\\", "/");
};

/** Recover the last `line:column` suffix from a V8 code-creation label. */
export const parseV8SourceLocation = (value: string) => {
    const matches = [...value.matchAll(/:(\d+):(\d+)(?=,|$)/gu)];
    const match = matches.at(-1);
    return match
        ? {
              prefix: normalizeV8SourceFile(value.slice(0, match.index)),
              line: Number(match[1]),
              column: Number(match[2])
          }
        : undefined;
};

/** Whether a descriptor carries the complete source-owner locator contract. */
export const hasV8SourceOwner = (target: HotV8TargetDescriptor) =>
    target.sourceFile !== undefined &&
    target.runtimeLocation?.schemaVersion === 1 &&
    Number.isInteger(target.runtimeLocation.line) &&
    target.runtimeLocation.line > 0 &&
    Number.isInteger(target.runtimeLocation.column) &&
    target.runtimeLocation.column > 0;

/** Whether the unstable V8 log fields match a layout backed by controls. */
export const supportsV8LogLayout = (
    engineVersion: string,
    platform = process.platform
) => {
    return supportedV8LogLayouts.some(
        compatibility =>
            compatibility.platform === platform &&
            (("engineVersion" in compatibility &&
                compatibility.engineVersion === engineVersion) ||
                ("engineVersionPattern" in compatibility &&
                    compatibility.engineVersionPattern.test(engineVersion)))
    );
};

/** Whether one derived syntax anchor is covered by the runtime compatibility controls. */
export const supportsV8CodeCreationLocation = (
    engineVersion: string,
    location?: HotV8CodeCreationLocation,
    platform = process.platform
) => {
    if (!location || !supportsV8LogLayout(engineVersion, platform))
        return false;
    if (
        location.schemaVersion !== 1 ||
        !/^[0-9a-f]{64}$/u.test(location.sourceSha256) ||
        !Number.isInteger(location.line) ||
        location.line < 1 ||
        !Number.isInteger(location.column) ||
        location.column < 1
    ) {
        return false;
    }
    return supportedV8CodeCreationLocationTuples.has(
        v8CodeCreationLocationTuple(location)
    );
};

const matchesV8SourceFile = (prefix: string, sourceFile: string) => {
    const source = normalizeV8SourceFile(sourceFile);
    const locators = source.startsWith("/")
        ? [source, `file://${source}`]
        : [source];
    return locators.some(
        locator => prefix === locator || prefix.endsWith(` ${locator}`)
    );
};

const unavailableV8LogSummary = (
    engineVersion: string,
    requestedTargetIds: readonly string[],
    unmatchedTargetIds: readonly string[],
    ambiguousTargetIds: readonly string[],
    gap: string
): HotV8LogSummary => ({
    oracleVersion: "1",
    engineVersion,
    events: [],
    graph: { maps: [], transitions: [], inlineCaches: [] },
    targetScope: {
        requestedTargetIds,
        matchedTargetIds: [],
        unmatchedTargetIds,
        ambiguousTargetIds
    },
    gap
});

/** Correlate the retained log header with the exact runtime V8 fingerprint. */
export const inspectV8LogVersion = (raw: string, engineVersion: string) => {
    let header: string | undefined;
    let headerCount = 0;
    for (const line of iterateV8LogLines(raw)) {
        if (!line.startsWith("v8-version,")) continue;
        header = line;
        headerCount++;
    }
    if (headerCount === 0) {
        return {
            gap: `The V8 log has no v8-version header for runtime ${engineVersion}.`
        };
    }
    if (headerCount !== 1) {
        return { gap: `The V8 log has ${headerCount} version headers.` };
    }
    const fields = (header as string).split(",");
    const coreFields = fields.slice(1, 5);
    if (fields.length < 5 || coreFields.some(field => !/^\d+$/u.test(field))) {
        return { gap: "The V8 log has a malformed v8-version header." };
    }
    const core = coreFields.join(".");
    const candidate = fields[5] && fields[5] !== "0" ? fields[5] : "";
    const observed = `${core}${candidate}`;
    return observed === engineVersion
        ? { observed }
        : {
              observed,
              gap: `V8 log version ${observed} does not match runtime engine ${engineVersion}.`
          };
};

/** Parse one V8 log into a target-scoped Map graph and IC histories. */
export const parseV8IcMapLog = (
    raw: string,
    engineVersion: string,
    streamId = "diagnostic:v8-ic-maps",
    targets: readonly HotV8TargetDescriptor[] = [],
    platform = process.platform
): HotV8LogSummary => {
    const version = inspectV8LogVersion(raw, engineVersion);
    const requestedTargetIds = targets.map(target => target.targetId);
    if (version.gap) {
        return unavailableV8LogSummary(
            engineVersion,
            requestedTargetIds,
            requestedTargetIds,
            [],
            version.gap
        );
    }
    if (!supportsV8LogLayout(version.observed as string, platform)) {
        return unavailableV8LogSummary(
            engineVersion,
            requestedTargetIds,
            requestedTargetIds,
            [],
            `V8 log layout ${version.observed} on ${platform} is not in the tightly scoped checked compatibility registry (${supportedV8LogLayouts.map(item => `${"engineVersion" in item ? item.engineVersion : item.engineVersionRange} on ${item.platform} via ${item.control}`).join(", ")}); raw evidence was retained without normalization.`
        );
    }
    const hasSupportedSourceOwner = (target: HotV8TargetDescriptor) =>
        hasV8SourceOwner(target) &&
        supportsV8CodeCreationLocation(
            engineVersion,
            target.runtimeLocation,
            platform
        );
    const unsupportedLocatorTargetIds = targets
        .filter(
            target =>
                hasV8SourceIntent(target) && !hasSupportedSourceOwner(target)
        )
        .map(target => target.targetId);
    const namedTargets = targets.filter(target => target.functionName !== "");
    const nameCounts = new Map<string, number>();
    for (const target of namedTargets) {
        nameCounts.set(
            target.functionName,
            (nameCounts.get(target.functionName) ?? 0) + 1
        );
    }
    const ambiguousTargetIds = targets
        .filter(
            target =>
                target.functionName !== "" &&
                nameCounts.get(target.functionName) !== 1 &&
                !hasV8SourceIntent(target)
        )
        .map(target => target.targetId);
    const attributableTargets = targets.filter(
        target =>
            (target.functionName !== "" &&
                nameCounts.get(target.functionName) === 1 &&
                !hasV8SourceIntent(target)) ||
            hasSupportedSourceOwner(target)
    );
    if (attributableTargets.length === 0) {
        return unavailableV8LogSummary(
            engineVersion,
            requestedTargetIds,
            targets
                .filter(
                    target =>
                        hasV8SourceIntent(target) || target.functionName === ""
                )
                .map(target => target.targetId),
            ambiguousTargetIds,
            unsupportedLocatorTargetIds.length > 0
                ? `No supported V8 code-creation locator was available for ${unsupportedLocatorTargetIds.join(",")}, so the process-global log was not attributed to inspected code.`
                : "No unique runtime target identity was available, so the process-global V8 log was not attributed to inspected code."
        );
    }

    const targetRanges: TargetRange[] = [];
    for (const line of iterateV8LogLines(raw)) {
        const fields = line.split(",");
        if (fields[0] !== "code-creation" || fields[1] !== "JS") continue;
        const nameAndLocation = fields.slice(6).join(",");
        const location = parseV8SourceLocation(nameAndLocation);
        const matchingTargets = attributableTargets.filter(candidate => {
            if (hasSupportedSourceOwner(candidate) && location) {
                return (
                    matchesV8SourceFile(
                        location.prefix,
                        candidate.sourceFile as string
                    ) &&
                    location.line === candidate.runtimeLocation?.line &&
                    location.column === candidate.runtimeLocation.column
                );
            }
            if (hasV8SourceIntent(candidate)) return false;
            return (
                candidate.functionName !== "" &&
                nameCounts.get(candidate.functionName) === 1 &&
                (nameAndLocation === candidate.functionName ||
                    nameAndLocation.startsWith(`${candidate.functionName} `) ||
                    nameAndLocation.startsWith(`${candidate.functionName},`))
            );
        });
        const target =
            matchingTargets.length === 1 ? matchingTargets[0] : undefined;
        if (!target) continue;
        try {
            const start = BigInt(fields[4]);
            const size = BigInt(Number(fields[5]));
            if (size > 0n) {
                targetRanges.push({
                    start,
                    end: start + size,
                    correlation:
                        location && hasSupportedSourceOwner(target)
                            ? "target"
                            : "name-only",
                    ...target
                });
            }
        } catch {
            // Unknown code-creation layout remains an advisory gap below.
        }
    }
    const matchedTargetIds = [
        ...new Set(targetRanges.map(range => range.targetId))
    ];
    const unmatchedTargetIds = targets
        .filter(
            target =>
                (hasV8SourceIntent(target) &&
                    !matchedTargetIds.includes(target.targetId)) ||
                (!hasV8SourceIntent(target) && target.functionName === "") ||
                (attributableTargets.includes(target) &&
                    !matchedTargetIds.includes(target.targetId))
        )
        .map(target => target.targetId);
    const targetAt = (address: string) => {
        try {
            const value = BigInt(address);
            const ranges = targetRanges.filter(
                range => value >= range.start && value < range.end
            );
            return new Set(ranges.map(range => range.targetId)).size === 1
                ? ranges[0]
                : undefined;
        } catch {
            return;
        }
    };

    const mapIds = new Map<string, string>();
    const normalizeMap = (address: string) => {
        let id = mapIds.get(address);
        if (!id) {
            id = `map-${mapIds.size + 1}`;
            mapIds.set(address, id);
        }
        return id;
    };
    const observedMapAddresses = new Set<string>();
    const inlineCaches: HotV8InlineCacheTransition[] = [];
    const events: HotRuntimeEvent[] = [];
    const addEvent = (
        event: Omit<HotRuntimeEvent, "sequence" | "streamId" | "purpose">
    ) => {
        events.push({
            ...event,
            sequence: events.length,
            streamId,
            purpose: "diagnostic"
        });
    };

    for (const line of iterateV8LogLines(raw)) {
        const fields = line.split(",");
        if (!icKinds.has(fields[0]) || fields.length < 8) continue;
        const operation = fields[0];
        const address = fields[1];
        const target = targetAt(address);
        if (!target) continue;
        const mapAddress = /^0x[\da-f]+$/iu.test(fields[7] ?? "")
            ? fields[7]
            : undefined;
        if (mapAddress) observedMapAddresses.add(mapAddress);
        const transition: HotV8InlineCacheTransition = {
            siteId: `${operation}:${address}:${fields[3]}:${fields[4]}`,
            operation,
            from: fields[5] || "unknown",
            to: fields[6] || "unknown",
            mapId: mapAddress ? normalizeMap(mapAddress) : undefined,
            key: fields[8] || undefined,
            line: parseV8NumericField(fields[3]),
            column: parseV8NumericField(fields[4]),
            correlation: target.correlation,
            targetId: target.targetId,
            functionName: target.functionName
        };
        inlineCaches.push(transition);
        addEvent({
            phase: "diagnostic",
            kind: "inline-cache-transition",
            source: "v8-log",
            correlation: transition.correlation,
            targetId: target.targetId,
            functionName: target.functionName,
            engineTimestamp: parseV8NumericField(fields[2]),
            message: `${operation} ${transition.from} -> ${transition.to}${transition.key ? ` for ${transition.key}` : ""}`,
            detail: line
        });
    }

    const selectedMapAddresses = new Set(observedMapAddresses);
    let expanded = true;
    let expansionPasses = 0;
    const maximumExpansionPasses = 64;
    while (expanded && expansionPasses < maximumExpansionPasses) {
        expanded = false;
        expansionPasses++;
        for (const line of iterateV8LogLines(raw)) {
            const fields = line.split(",");
            if (fields[0] !== "map" || fields.length < 6) continue;
            const from = fields[3];
            const to = fields[4];
            if (
                selectedMapAddresses.has(to) &&
                !selectedMapAddresses.has(from)
            ) {
                selectedMapAddresses.add(from);
                expanded = true;
            }
        }
    }
    const selectedTransitions: HotV8MapEdge[] = [];
    let graphTruncated = false;
    for (const line of iterateV8LogLines(raw)) {
        const fields = line.split(",");
        if (fields[0] !== "map" || fields.length < 6) continue;
        const from = fields[3];
        const to = fields[4];
        if (selectedMapAddresses.has(to) && !selectedMapAddresses.has(from)) {
            graphTruncated = true;
        }
        if (!selectedMapAddresses.has(from) || !selectedMapAddresses.has(to)) {
            continue;
        }
        selectedTransitions.push({
            from: normalizeMap(from),
            to: normalizeMap(to),
            reason: fields[1] || "unknown",
            property: fields.at(-1) || undefined
        });
    }
    const selectedMapData = new Map<
        string,
        { elementsKind?: string; properties: Set<string> }
    >(
        [...selectedMapAddresses].map(address => [
            normalizeMap(address),
            { properties: new Set<string>() }
        ])
    );
    for (const line of iterateV8LogLines(raw)) {
        if (!line.startsWith("map-details,")) continue;
        const fields = line.split(",");
        const id = mapIds.get(fields[2]);
        const data = id ? selectedMapData.get(id) : undefined;
        if (!data) continue;
        const detail = fields.slice(3).join(",");
        data.elementsKind =
            detail.match(/elements kind: ([A-Z_]+)/u)?.[1] ?? data.elementsKind;
        for (const match of detail.matchAll(/#([^ ]+) \(/gu)) {
            data.properties.add(match[1]);
        }
    }
    const maps: HotV8MapNode[] = [];
    for (const [id, data] of selectedMapData) {
        maps.push({
            id,
            elementsKind: data.elementsKind,
            properties: [...data.properties].toSorted()
        });
    }
    for (const edge of selectedTransitions) {
        addEvent({
            phase: "diagnostic",
            kind: "map-transition",
            source: "v8-log",
            correlation: "unavailable",
            message: `${edge.from} -> ${edge.to}${edge.property ? ` by ${edge.property}` : ""}`
        });
    }

    const recognized = inlineCaches.length > 0;
    const incompleteScope =
        unmatchedTargetIds.length > 0 || ambiguousTargetIds.length > 0;
    return {
        oracleVersion: "1",
        engineVersion,
        events,
        graph: { maps, transitions: selectedTransitions, inlineCaches },
        targetScope: {
            requestedTargetIds,
            matchedTargetIds,
            unmatchedTargetIds,
            ambiguousTargetIds
        },
        gap:
            [
                graphTruncated
                    ? `Target-connected Map ancestry exceeded ${maximumExpansionPasses} bounded parser passes; the retained graph is partial.`
                    : undefined,
                !recognized
                    ? "The V8 log contained no recognized target-scoped Map or inline-cache records; preserve the raw artifact and update the versioned parser."
                    : undefined,
                unsupportedLocatorTargetIds.length > 0
                    ? `The AST/V8 code-creation locator compatibility matrix did not cover: ${unsupportedLocatorTargetIds.join(",")}.`
                    : undefined,
                incompleteScope
                    ? `V8 target scoping was partial: unmatched=${unmatchedTargetIds.join(",") || "none"}; ambiguous-name=${ambiguousTargetIds.join(",") || "none"}.`
                    : undefined
            ]
                .filter((message): message is string => Boolean(message))
                .join(" ") || undefined
    };
};
