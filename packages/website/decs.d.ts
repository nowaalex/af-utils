declare module "@af-utils/styled";

declare module "*.mdx" {
    let MDXComponent: (props) => JSX.Element;
    export default MDXComponent;
}
