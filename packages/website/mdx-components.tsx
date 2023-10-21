import AutoLink from "components/AutoLink";
import type { ReactNode } from "react";
import type { MDXComponents } from "mdx/types";

export const useMDXComponents = (components: MDXComponents) => ({
    ...components,
    wrapper: ({ children }: { children: ReactNode }) => (
        <div className="prose">{children}</div>
    ),
    a: AutoLink
});
