import remarkGfm from "remark-gfm";
import { refractor } from "refractor";
import jsx from "refractor/lang/jsx.js";
import rehypeRewrite from "rehype-rewrite";
import rehypePrism from "@mapbox/rehype-prism";
import remarkToc from "remark-toc";
import nextMdx from "@next/mdx";

refractor.register(jsx);

const withMDX = nextMdx({
    options: {
        remarkPlugins: [remarkGfm, remarkToc],
        rehypePlugins: [
            rehypePrism,
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
                            !node.properties.className?.length &&
                            node.children.every(child => child.type === "text")
                        ) {
                            const combinedText = node.children.reduce(
                                (acc, v) => acc + v.value,
                                ""
                            );
                            const result = refractor.highlight(
                                combinedText,
                                "jsx"
                            );
                            node.properties.className = ["language-jsx"];
                            node.children = result.children;
                        }
                    }
                }
            ]
        ]
    }
});

const config = withMDX({
    pageExtensions: ["js", "jsx", "md", "mdx"],
    reactStrictMode: true,
    async redirects() {
        return [
            {
                source: "/",
                destination: "/examples/list/Simple",
                permanent: true
            }
        ];
    }
});

export default config;
