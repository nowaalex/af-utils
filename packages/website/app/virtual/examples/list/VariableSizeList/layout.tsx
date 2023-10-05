// @ts-ignore
import Code from "!!code-webpack-loader!./page";
import Example from "components/layouts/Example";
import Description from "./index.mdx";

export const metadata = {
    title: "Variable size list",
    description:
        "All dimensions are calculated on the fly. Items are added to ResizeObserver when mounted. Use estimatedItemSize to improve scrolling experience."
};

export default Example(Code, Description);
