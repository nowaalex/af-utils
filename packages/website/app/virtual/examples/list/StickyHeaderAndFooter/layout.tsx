import Code from "!!code-webpack-loader!./page";
import Example from "components/layouts/Example";
import Description from "./index.mdx";

export const metadata = {
    title: "Examples: VsList",
    description:
        "Header and footer can have sticky positioning. In order to use it, connect desired element to the model and add position: sticky style to it."
};

export default Example(Code, Description);
