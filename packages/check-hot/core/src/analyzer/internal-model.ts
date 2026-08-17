import type { Comment, EcmaScriptModule, Program } from "oxc-parser";

import type { AstNode } from "./ast.js";
import type { HotAnalysisCandidate } from "./model.js";
import type { V8CodeCreationAnchor } from "./runtime-locations/v8-code-creation/derive.js";
import type { HotPublicFunctionLocator } from "../types.js";

/** Loader branch used by one source dependency edge. */
export type ModuleRequestMode = "import" | "require";

/** Preserve import/require identity for dual package artifacts. */
export const moduleDependencyKey = (request: string, mode: ModuleRequestMode) =>
    `${mode}\u0000${request}`;

/** Parsed source plus the local dependency edges discovered for it. */
export interface ParsedFile {
    file: string;
    source: string;
    program: Program;
    module: EcmaScriptModule;
    comments: readonly Comment[];
    dependencies: ReadonlyMap<string, string>;
}

/** Parameter origin retained while following local aliases and destructuring. */
export interface ParameterFlow {
    name: string;
    index: number;
    path: readonly (string | number)[];
    automatable?: boolean;
}

/** Function declaration plus the public origin inferred for it. */
export interface CandidateNode {
    node: AstNode;
    /** Source range whose text matches Function.prototype.toString at runtime. */
    runtimeNode: AstNode;
    /** Class `static` is not included in Function.prototype.toString. */
    stripStaticRuntimePrefix: boolean;
    /** Exact code-creation anchor derived from the authenticated syntax node. */
    v8CodeCreation?: V8CodeCreationAnchor;
    name: string;
    kind: HotAnalysisCandidate["kind"];
    /** Exact enclosing class identity used by instance-shape analysis. */
    classNode?: AstNode;
    className?: string;
    exported: boolean;
    exportName?: string;
    targetId?: string;
    publicTargets: readonly HotPublicFunctionLocator[];
    publicPaths: readonly string[];
    annotation?: string;
    arity: number;
    parameterNames: readonly string[];
    parameterBindings: readonly ParameterFlow[];
}
