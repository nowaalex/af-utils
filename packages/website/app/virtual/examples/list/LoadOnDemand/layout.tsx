import Code from "!!code-webpack-loader!./page";
import Example from "components/layouts/Example";
import Description from "./index.mdx";

export const metadata = {
    title: "Examples: LoadOnDemand",
    description:
        "Virtual scroll model can emit EVT_RANGE, which is very convenient for loading something on demand. Here new posts are loaded when list is scrolled till the end, but this behavior can be easily customized."
};

export default Example(Code, Description);
