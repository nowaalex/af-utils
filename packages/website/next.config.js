const withMDX = require("@next/mdx")({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [require("remark-prism")],
    rehypePlugins: [],
  },
});

module.exports = withMDX({
  pageExtensions: ["js", "jsx", "md", "mdx"],
  reactStrictMode: true,
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
