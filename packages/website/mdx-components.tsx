import AutoLink from "components/AutoLink";
import { ReactNode } from "react";

export const useMDXComponents = (components: any) => ({
    ...components,
    wrapper: ({ children }: { children: ReactNode }) => (
        <div className="prose max-w-full w-full">{children}</div>
    ),
    a: AutoLink
});
