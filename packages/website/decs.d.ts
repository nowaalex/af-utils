declare module "*.mdx" {
    export default props => JSX.Element;
}

declare module "!!code-webpack-loader!*" {
    export default props => JSX.Element;
}
