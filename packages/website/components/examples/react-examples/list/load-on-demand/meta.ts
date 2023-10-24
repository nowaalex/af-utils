import { Metadata } from "next";

const metadata = {
    description:
        "Virtual scroll model can emit events, which is very convenient for loading something on demand. \
Here new posts are loaded when list is scrolled till the end, but this behavior can be easily customized."
} satisfies Metadata;

export default metadata;
