module.exports = {
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
}
