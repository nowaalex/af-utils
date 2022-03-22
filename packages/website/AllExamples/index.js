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
    link.replace(/^\./, "/examples").replace(/\/index\.js$/, "");

const keys = requireComponent.keys();

export const components = keys.map(toUrl);

export const table = Object.fromEntries(
    keys.map(path => [
        toUrl(path),
        {
            Component: dynamic(() => requireComponent(path)),
            ComponentCode: dynamic(() =>
                requireCode(path).then(code => () => (
                    <code
                        className="language-jsx"
                        dangerouslySetInnerHTML={{ __html: code.default }}
                    />
                ))
            )
        }
    ])
);
