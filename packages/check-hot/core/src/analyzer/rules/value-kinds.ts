/** Whether an expression class is concrete enough for representation grouping. */
export const isConcreteValueKind = (kind: string) =>
    kind === "array" ||
    kind === "bigint" ||
    kind === "boolean" ||
    kind === "function" ||
    kind === "null" ||
    kind === "number" ||
    kind === "object" ||
    kind === "string";

/** Normalize a statically concrete expression class for representation grouping. */
export const concreteValueKind = (kind: string) =>
    kind === "TemplateLiteral"
        ? "string"
        : isConcreteValueKind(kind)
          ? kind
          : undefined;
