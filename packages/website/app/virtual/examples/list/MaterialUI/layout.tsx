// @ts-ignore
import Code from "!!code-webpack-loader!./page";
import Example from "components/layouts/Example";
import Description from "./index.mdx";

export const metadata = {
    title: "Material UI",
    description:
        "List supports component prop, so it can be easily integrated with Material UI. Also disablePadding should be passed to MuiList, because scroll element offsets are not supported."
};

export default Example(Code, Description);
