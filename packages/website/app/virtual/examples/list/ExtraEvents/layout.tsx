import Code from "!!code-webpack-loader!./page";
import Example from "components/layouts/Example";
import Description from "./index.mdx";

export const metadata = {
    title: "Examples: LoadOnDemand",
    description:
        "Virtual scroll model allows multiple Subscriptions. This helps to optimize performance, as only needed components are rerendered."
};

export default Example(Code, Description);
