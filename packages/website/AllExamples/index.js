import dynamic from "next/dynamic";
import startCase from "lodash/startCase";

const EXCEPTIONS = {
    complexTable: "Complex Table (unstable)"
};

const getPathInfo = path => {
    const short = path.slice(2).replace(/\/index\.(js|mdx)$/, "");
    return {
        staticPaths: short.split("/"),
        short,
        path
    };
};

const requireComponent = require.context(
    "/components/examples",
    true,
    /index\.js$/,
    "lazy"
);
const requireCode = require.context(
    "!!prism-webpack-loader!/components/examples",
    true,
    /index\.js$/,
    "lazy"
);

const requireDescription = require.context(
    "/components/examples",
    true,
    /index\.mdx$/,
    "lazy"
);

export const components = requireComponent.keys().map(getPathInfo);

export const table = requireDescription
    .keys()
    .map(getPathInfo)
    .reduce(
        (acc, v) => (
            (acc[v.short].Description = dynamic(
                () => requireDescription(v.path),
                {
                    suspense: true
                }
            )),
            acc
        ),
        components.reduce(
            (acc, v) => (
                (acc[v.short] = {
                    title: v.staticPaths
                        .map(v => EXCEPTIONS[v] || startCase(v))
                        .join(" / "),
                    Component: dynamic(() => requireComponent(v.path), {
                        suspense: true
                    }),
                    Code: dynamic(
                        () =>
                            requireCode(v.path).then(code => ({
                                default: () => (
                                    <code
                                        className="language-jsx"
                                        dangerouslySetInnerHTML={{
                                            __html: code.default
                                        }}
                                    />
                                )
                            })),
                        { suspense: true }
                    ),
                    Description: null
                }),
                acc
            ),
            {}
        )
    );
