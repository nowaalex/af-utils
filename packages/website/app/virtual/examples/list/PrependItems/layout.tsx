// @ts-ignore
import Code from "!!code-webpack-loader!./page";
import Example from "components/layouts/Example";
import Description from "./index.mdx";

export const metadata = {
    title: "Prepend",
    description:
        "Visible elements range must be persisted after new ones are prepended? Virtual scroll model exposes visibleFrom, which allows to get the position of the first visible item."
};

export default Example(Code, Description);
