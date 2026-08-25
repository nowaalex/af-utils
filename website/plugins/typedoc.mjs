import {
    MarkdownPageEvent,
    MarkdownRendererEvent
} from "typedoc-plugin-markdown";
import { Comment, ReflectionKind } from "typedoc";

const REFERENCE_ROOT = "/virtual/reference/";

const normalizeWhitespace = value => value.replace(/\s+/gu, " ").trim();

const startsHtmlTag = (value, start) => {
    let nameStart = start + 1;
    const marker = value[nameStart];
    if (marker === "!" || marker === "?") return true;
    if (marker === "/") nameStart += 1;
    const first = value.codePointAt(nameStart);
    return (
        first !== undefined &&
        ((first >= 65 && first <= 90) || (first >= 97 && first <= 122))
    );
};

export const stripHtml = value => {
    const result = [];
    for (let index = 0; index < value.length; index += 1) {
        const character = value[index];
        if (character !== "<") {
            result.push(character);
            continue;
        }
        let tagEnd = index + 1;
        while (tagEnd < value.length && value[tagEnd] !== ">") {
            if (value[tagEnd] === "<") break;
            tagEnd += 1;
        }
        if (value[tagEnd] === "<") {
            result.push("&lt;");
            continue;
        }
        if (tagEnd === value.length) {
            result.push(character);
            continue;
        }
        if (!startsHtmlTag(value, index)) {
            result.push(character);
            continue;
        }
        index = tagEnd;
    }
    return result.join("");
};

const stripMarkdown = value =>
    normalizeWhitespace(
        stripHtml(
            value
                .replace(
                    /\{@(?:link|linkcode|linkplain)\s+([^}|]+)(?:\|([^}]+))?\}/gu,
                    (_, target, label) => label ?? target
                )
                .replace(/```[\s\S]*?```/gu, "")
                .replace(/!\[([^\]]*)\]\([^)]*\)/gu, "$1")
                .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
                .replace(/`([^`]+)`/gu, "$1")
                .replace(/[*_~]/gu, "")
        )
    );

const getComment = model => {
    if (model.signatures?.length === 1) {
        return model.signatures[0].comment ?? model.comment;
    }
    return model.comment;
};

const getDescription = model => {
    const comment = getComment(model);
    if (!comment) return "";

    const summary = Comment.combineDisplayParts(comment.summary);
    const firstParagraph = summary.split(/\n\s*\n/u, 1)[0] ?? "";
    return stripMarkdown(firstParagraph);
};

const getPackageReflection = model => {
    let current = model;
    let packageReflection;

    while (current && !current.isProject()) {
        if (current.name.startsWith("@af-utils/")) {
            packageReflection = current;
        }
        current = current.parent;
    }

    return packageReflection;
};

const getSymbol = (model, packageReflection) => {
    if (!packageReflection || model === packageReflection) return "";

    const names = [];
    let current = model;
    while (current && current !== packageReflection) {
        names.push(current.name);
        current = current.parent;
    }
    return names.toReversed().join(".");
};

const splitPascalCase = value => value.replace(/([a-z0-9])([A-Z])/gu, "$1 $2");

const isHook = model =>
    model.kindOf?.(ReflectionKind.Function) && /^use[A-Z\d]/u.test(model.name);

const isComponent = model =>
    model.kindOf?.(ReflectionKind.Function) &&
    getComment(model)?.blockTags.some(
        tag =>
            tag.tag === "@group" &&
            Comment.combineDisplayParts(tag.content).trim() === "Components"
    );

const getKind = model =>
    model.isDocument()
        ? "document"
        : isComponent(model)
          ? "component"
          : isHook(model)
            ? "hook"
            : (ReflectionKind[model.kind] ?? "reflection").toLowerCase();

const getPageTitle = model => {
    if (model.isProject()) return "Documentation";

    const kind = model.isDocument()
        ? "Document"
        : isComponent(model)
          ? "Component"
          : isHook(model)
            ? "Hook"
            : splitPascalCase(ReflectionKind[model.kind] ?? "Reflection");
    const suffix =
        model.kindOf?.(ReflectionKind.Function) && !isComponent(model)
            ? "()"
            : "";
    return `${kind}: ${model.name}${suffix}`;
};

const getReferencePath = url => `${REFERENCE_ROOT}${url.replace(/\.md$/u, "")}`;

export const rewriteInternalMarkdownLinks = contents =>
    contents.replace(
        /(\]\((?![a-z][a-z\d+.-]*:|\/\/)[^)\n]*?)\.md(?=#[^)]*\)|\))/giu,
        "$1"
    );

export const groupHooksInContents = contents =>
    contents.replace(
        /(^## Functions\n\n)((?:- [^\n]+\n?)+)/gmu,
        (_, _heading, list) => {
            const items = list.trimEnd().split("\n");
            const hooks = items.filter(item => /^- \[use[A-Z\d]/u.test(item));
            if (hooks.length === 0) return `${_heading}${list}`;

            const functions = items.filter(
                item => !/^- \[use[A-Z\d]/u.test(item)
            );
            return [
                ...(functions.length > 0
                    ? [`## Functions\n\n${functions.join("\n")}`]
                    : []),
                `## Hooks\n\n${hooks.join("\n")}`
            ].join("\n\n");
        }
    );

const rewritePackageHeading = (contents, model) => {
    const packageReflection = getPackageReflection(model);
    if (!packageReflection || packageReflection !== model) return contents;

    const displayName = packageReflection.name.replace(
        "@af-utils/virtual-",
        ""
    );
    return contents.replace(/^# .+$/mu, `# ${displayName}`);
};

const rewriteComponentHeading = (contents, model) =>
    isComponent(model) ? contents.replace(/^# (.+)\(\)$/mu, "# $1") : contents;

const normalizeNavigationPaths = items => {
    for (const item of items ?? []) {
        if (item.path) item.path = item.path.replace(/\.md$/u, "");
        normalizeNavigationPaths(item.children);
    }
};

const groupHooksInNavigation = items => {
    for (const item of items ?? []) {
        const children = item.children ?? [];
        const functionsIndex = children.findIndex(
            child => child.title === "Functions"
        );

        if (functionsIndex !== -1) {
            const functions = children[functionsIndex];
            const hooks = functions.children?.filter(child =>
                /^use[A-Z\d]/u.test(child.title)
            );
            const otherFunctions = functions.children?.filter(
                child => !/^use[A-Z\d]/u.test(child.title)
            );

            if (hooks?.length) {
                item.children = [
                    ...children.slice(0, functionsIndex),
                    ...(otherFunctions?.length
                        ? [{ ...functions, children: otherFunctions }]
                        : []),
                    { title: "Hooks", children: hooks },
                    ...children.slice(functionsIndex + 1)
                ];
            }
        }

        groupHooksInNavigation(item.children);
    }
};

export function load(app) {
    app.renderer.on(MarkdownRendererEvent.BEGIN, event => {
        groupHooksInNavigation(event.navigation);
        normalizeNavigationPaths(event.navigation);
    });

    app.renderer.on(MarkdownPageEvent.BEGIN, page => {
        const packageReflection = getPackageReflection(page.model);
        const packageName = packageReflection?.name ?? "";
        const symbol = getSymbol(page.model, packageReflection);
        const title = getPageTitle(page.model);
        const description =
            getDescription(page.model) || `${title} API reference.`;
        const referencePath = getReferencePath(page.url);
        const kind = getKind(page.model);

        page.frontmatter = {
            ...page.frontmatter,
            title,
            description,
            package: packageName,
            symbol,
            kind,
            referencePath
        };
    });

    app.renderer.on(MarkdownPageEvent.END, page => {
        page.contents = rewriteComponentHeading(
            rewritePackageHeading(
                groupHooksInContents(
                    rewriteInternalMarkdownLinks(page.contents)
                ),
                page.model
            ),
            page.model
        );
    });
}
