// @ts-ignore
import Code from "!!code-webpack-loader!./page";
import Example from "components/layouts/Example";
import Description from "./index.mdx";

export const metadata = {
    title: "Simple",
    description:
        "Virtual scroll can be used to render huge lists without performance problems. All dimensions are calculated automatically."
};

export default Example(Code, Description);
