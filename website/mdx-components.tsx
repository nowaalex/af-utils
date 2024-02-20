import AutoLink from "components/AutoLink";
import type { MDXComponents } from "mdx/types";

export const useMDXComponents = (components: MDXComponents) => ({
    ...components,
    a: AutoLink
});
