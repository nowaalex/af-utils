import path from "path";
import remarkGfm from "remark-gfm";
import remarkPrism from "remark-prism";
import remarkToc from "remark-toc";
import nextMdx from "@next/mdx";
import set from "lodash/set.js";

const __dirname = path.resolve();

const withMDX = nextMdx({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      remarkGfm,
      remarkPrism,
      remarkToc
    ],
    rehypePlugins: [],
  },
});

const config = withMDX({
  pageExtensions: ["js", "jsx", "md", "mdx"],
  reactStrictMode: true,
  webpack: config => set(
    config,
    "resolveLoader.alias.prism-loader",
    path.resolve( __dirname, "./loaders/prism-loader.js" )
  ),
  async redirects() {
    return [
      {
        source: "/",
        destination: "/examples/list/Simple",
        permanent: true,
      },
    ]
  },
});

export default config;