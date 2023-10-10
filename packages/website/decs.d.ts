declare module "*.mdx" {
    let MDXComponent: (props) => JSX.Element;
    export default MDXComponent;
}

declare module "@af-utils/virtual-core/lib/bundlesize*";
declare module "@af-utils/virtual-react/lib/bundlesize*";
