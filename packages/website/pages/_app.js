import { MDXProvider } from "@mdx-js/react";
import AutoLink from "/components/AutoLink";
import VirtualLayout from "/components/layouts/Virtual";
import MdxWrapper from "/components/MdxWrapper";
import "/styles/globals.css";
import "/styles/code.css";

const FUCKING_DIRTY_MDX_LAYOUTS = {
    virtual: page => (
        <VirtualLayout>
            <MdxWrapper>{page}</MdxWrapper>
        </VirtualLayout>
    )
};

const components = {
    a: AutoLink
};

const MyApp = ({ Component, pageProps }) => {
    const { dirtyMdxLayout, ...rest } = pageProps;
    const getLayout =
        Component.getLayout ||
        FUCKING_DIRTY_MDX_LAYOUTS[dirtyMdxLayout] ||
        (page => page);

    return (
        <MDXProvider components={components}>
            {getLayout(<Component {...rest} />)}
        </MDXProvider>
    );
};

export default MyApp;
