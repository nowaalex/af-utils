import dynamic from "next/dynamic";
import startCase from "lodash/startCase";

const EXCEPTIONS = {
    complexTable: "Complex Table (unstable)"
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

const keys = requireComponent.keys();

export const components = keys.map(k => {
    const short = k.slice(2).replace(/\/index\.js$/, "");
    return {
        staticPaths: short.split("/"),
        short,
        path: k
    };
});

export const table = components.reduce(
    (acc, v) => (
        (acc[v.short] = {
            title: v.staticPaths
                .map(v => EXCEPTIONS[v] || startCase(v))
                .join(" / "),
            Component: dynamic(() => requireComponent(v.path), {
                suspense: true
            }),
            ComponentCode: dynamic(
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
            )
        }),
        acc
    ),
    {}
);
