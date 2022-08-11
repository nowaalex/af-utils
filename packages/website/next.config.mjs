import remarkGfm from "remark-gfm";
import { refractor } from "refractor";
import rehypeRewrite from "rehype-rewrite";
import remarkToc from "remark-toc";
import nextMdx from "@next/mdx";
import rehypeSlug from "rehype-slug";
import nextBundleAnalyzer from "@next/bundle-analyzer";

import typescript from "refractor/lang/typescript.js";
import javascript from "refractor/lang/javascript.js";
import jsx from "refractor/lang/jsx.js";
import css from "refractor/lang/css.js";
import scss from "refractor/lang/scss.js";
import sass from "refractor/lang/sass.js";
import bash from "refractor/lang/bash.js";

refractor.register(typescript);
refractor.register(javascript);
refractor.register(jsx);
refractor.register(css);
refractor.register(scss);
refractor.register(sass);
refractor.register(bash);

const withBundleAnalyzer = nextBundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
    openAnalyzer: false
});

const withMDX = nextMdx({
    options: {
        providerImportSource: "@mdx-js/react",
        remarkPlugins: [remarkGfm, remarkToc],
        rehypePlugins: [
            rehypeSlug,

            /*
        I did not find a clear way to highlight inline code blocks with specified language.
        RemarkPrism transformInlineCode works like unconfigurable shit, rehypePrism does not have this option.
      */
            [
                rehypeRewrite,
                {
                    rewrite: (node, index, parent) => {
                        if (
                            node.tagName === "code" &&
                            node.children.every(child => child.type === "text")
                        ) {
                            let combinedText = node.children
                                .reduce((acc, v) => acc + v.value, "")
                                .trim();

                            let lang;

                            const newClassName = (node.properties.className ||=
                                []);

                            const langMatch = newClassName
                                .find(c => c.startsWith("language-"))
                                ?.match(/language-(.+)/);

                            if (langMatch) {
                                lang = langMatch[1];
                            } else {
                                const dirtyLangMatch =
                                    combinedText.match(/^~(.+)~/);

                                if (dirtyLangMatch) {
                                    lang = dirtyLangMatch[1];
                                    combinedText = combinedText.slice(
                                        dirtyLangMatch[0].length
                                    );
                                } else {
                                    lang = "javascript";
                                }

                                newClassName.push(`language-${lang}`);
                            }

                            const result = refractor.highlight(
                                combinedText,
                                lang
                            );

                            node.children = result.children;

                            if (parent && parent.tagName === "pre") {
                                // all syntax highlighters behave this way
                                (parent.properties.className ||= []).push(
                                    `language-${lang}`
                                );
                            }
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
        webpack(config) {
            if (config.optimization?.splitChunks) {
                config.optimization.splitChunks.minSize = 1024;
            }
            return config;
        },
        async redirects() {
            return [
                {
                    source: "/examples/:v*",
                    destination: "/virtual/examples/:v*",
                    permanent: true
                },
                {
                    source: "/docs/:d*",
                    destination: "/virtual",
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
