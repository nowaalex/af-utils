import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
    MarkdownPageEvent,
    MarkdownRendererEvent
} from "typedoc-plugin-markdown";
import { Comment, ReflectionKind } from "typedoc";

const REFERENCE_ROOT = "/virtual/reference/";

const pages = [];

const normalizeWhitespace = value => value.replace(/\s+/gu, " ").trim();

const stripMarkdown = value =>
    normalizeWhitespace(
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
            .replace(/<[^>]*>/gu, "")
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

const getKind = model =>
    model.isDocument()
        ? "document"
        : (ReflectionKind[model.kind] ?? "reflection").toLowerCase();

const getPageTitle = model => {
    if (model.isProject()) return "Documentation";

    const kind = model.isDocument()
        ? "Document"
        : splitPascalCase(ReflectionKind[model.kind] ?? "Reflection");
    const suffix = model.kindOf?.(ReflectionKind.Function) ? "()" : "";
    return `${kind}: ${model.name}${suffix}`;
};

const getReferencePath = url => `${REFERENCE_ROOT}${url.replace(/\.md$/u, "")}`;

const rewriteInternalMarkdownLinks = contents =>
    contents.replace(
        /(\]\((?![a-z][a-z\d+.-]*:|\/\/)[^)\n]*?)\.md(?=#[^)]*\)|\))/giu,
        "$1"
    );

const normalizeNavigationPaths = items => {
    for (const item of items ?? []) {
        if (item.path) item.path = item.path.replace(/\.md$/u, "");
        normalizeNavigationPaths(item.children);
    }
};

export function load(app) {
    app.renderer.on(MarkdownRendererEvent.BEGIN, event => {
        pages.length = 0;
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

        pages.push({
            description,
            kind,
            package: packageName,
            path: referencePath,
            symbol,
            title
        });
    });

    app.renderer.on(MarkdownPageEvent.END, page => {
        page.contents = rewriteInternalMarkdownLinks(page.contents);
    });

    app.renderer.postMarkdownRenderAsyncJobs.push(async event => {
        const outputFile = join(event.outputDirectory, "api-manifest.json");
        await mkdir(event.outputDirectory, { recursive: true });
        await writeFile(
            outputFile,
            `${JSON.stringify({ pages }, null, 2)}\n`,
            "utf8"
        );
    });
}
