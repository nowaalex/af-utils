import remarkGfm from "remark-gfm";
import { refractor } from "refractor";
import rehypeRewrite from "rehype-rewrite";
import rehypePrism from "@mapbox/rehype-prism";
import remarkToc from "remark-toc";
import nextMdx from "@next/mdx";
import rehypeSlug from "rehype-slug";
import nextBundleAnalyzer from "@next/bundle-analyzer";

import jsx from "refractor/lang/jsx.js";
import css from "refractor/lang/css.js";
import bash from "refractor/lang/bash.js";
import jsExtras from "refractor/lang/js-extras.js";
import cssExtras from "refractor/lang/css-extras.js";

refractor.register(jsx);
refractor.register(css);
refractor.register(bash);
refractor.register(jsExtras);
refractor.register(cssExtras);

const withBundleAnalyzer = nextBundleAnalyzer({
    enabled: false
});

const withMDX = nextMdx({
    options: {
        providerImportSource: "@mdx-js/react",
        remarkPlugins: [remarkGfm, remarkToc],
        rehypePlugins: [
            rehypePrism,
            rehypeSlug,

            /*
        I did not find a clear way to highlight inline code blocks as jsx.
        RemarkPrism transformInlineCode works like unconfigurable shit, rehypePrism does not have this option.
      */
            [
                rehypeRewrite,
                {
                    rewrite: node => {
                        if (
                            node.tagName === "code" &&
                            node.children.every(child => child.type === "text")
                        ) {
                            let lang;

                            const newClassName =
                                node.properties.className || [];
                            const langMatch = newClassName
                                .find(c => c.startsWith("language-"))
                                ?.match(/language-(.+)/);

                            if (!langMatch) {
                                newClassName.push("language-jsx");
                                lang = "jsx";
                            } else {
                                lang = langMatch[1];
                            }

                            const combinedText = node.children.reduce(
                                (acc, v) => acc + v.value,
                                ""
                            );
                            const result = refractor.highlight(
                                combinedText,
                                lang
                            );

                            node.properties.className = newClassName;
                            node.children = result.children;
                        }
                    }
                }
            ]
        ]
    }
});

const config = withBundleAnalyzer(
    withMDX({
        i18n: {
            locales: ["en"],
            defaultLocale: "en"
        },
        pageExtensions: ["js", "jsx", "md", "mdx"],
        reactStrictMode: true,
        async redirects() {
            return [
                {
                    source: "/examples/:v*",
                    destination: "/virtual/examples/:v*",
                    permanent: true
                },
                {
                    source: "/why",
                    destination: "/virtual",
                    permanent: true
                },
                ...["/headless", "/size", "/table", "/list"].map(oldPath => ({
                    source: oldPath,
                    destination: `/virtual${oldPath}`,
                    permanent: true
                }))
            ];
        }
    })
);

export default config;
