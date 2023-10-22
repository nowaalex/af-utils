import AutoLink from "components/AutoLink";
import { cx } from "@emotion/css";
import type { ComponentPropsWithoutRef, ElementType } from "react";
import type { MDXComponents } from "mdx/types";

type WrapperProps<T extends ElementType = "div"> =
    ComponentPropsWithoutRef<T> & { component?: T; className?: string };

export const useMDXComponents = (components: MDXComponents) => ({
    ...components,
    wrapper: <T extends ElementType = "div">({
        className,
        component,
        children
    }: WrapperProps<T>) => {
        const C = component || "div";
        return <C className={cx("prose", className)}>{children}</C>;
    },
    a: AutoLink
});
