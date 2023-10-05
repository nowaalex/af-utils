// @ts-ignore
import Code from "!!code-webpack-loader!./page";
import Example from "components/layouts/Example";
import Description from "./index.mdx";

export const metadata = {
    title: "Load On Demand"
};

export default Example(Code, Description);
