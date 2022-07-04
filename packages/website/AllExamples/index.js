import dynamic from "next/dynamic";

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

const toUrl = link =>
    "/virtual/examples" + link.slice(1).replace(/\/index\.js$/, "");

const keys = requireComponent.keys();

export const components = keys.map(toUrl);

export const table = Object.fromEntries(
    keys.map(path => [
        toUrl(path),
        {
            Component: dynamic(() => requireComponent(path), {
                suspense: true
            }),
            ComponentCode: dynamic(
                () =>
                    requireCode(path).then(code => ({
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
        }
    ])
);
