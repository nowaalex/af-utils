import React, { Suspense, lazy } from "react";
import { css, Global } from "@emotion/core";
/* App is deployed to github pages, so BrowserRouter would not work there */
import { HashRouter, Switch, Route, Redirect, useLocation } from "react-router-dom";

const Menu = lazy(() => import( "./Menu" ));
const Example = lazy(() => import( "./Example" ));
const Docs = lazy(() => import( "./Docs" ));

const growCss = css`
    flex: 1 1 auto;
`;

const globalCss = css`
    html, body, #root {
        height: 100%;
    }

    #root {
        display: flex;
        flex-flow: row nowrap;
        font-family: monospace;

        @media(max-width: 900px){
            flex-flow: column nowrap;
        }
    }

    table {
        border-spacing: 0;
    }

    td {
        padding: 0.4em;
    }

    thead, tfoot {
        th, td {
            font-weight: bold;
            background: #d3d3d3;
        }
    }
`;

const bundleIframeCss = css`
    ${growCss};
    border: none;
`;

const mainFieldWrapperCss = css`
    ${growCss};
    display: flex;
    flex-flow: column nowrap;
    min-height: 0;
    min-width: 0;
    text-align: center;
    overflow: auto;
`;

const Header = () => <h2>{useLocation().pathname.slice( 1 )}</h2>;

const App = () => (
    <HashRouter>
        <Global styles={globalCss} />
        <Suspense fallback="Loading menu...">
            <Menu />
        </Suspense>
        <div css={mainFieldWrapperCss}>
            <Header />
            <Switch>
                <Route path="/examples/:example(.+)">
                    <Suspense fallback="Loading Examples container...">
                        <Example />
                    </Suspense>
                </Route>
                <Route path="/misc/bundle">
                    <iframe css={bundleIframeCss} src={`${ASSETS_PATH}bundle.html`} />
                </Route>
                <Route path="/docs/:docpage">
                    <Suspense fallback="Loading docs...">
                        <Docs />
                    </Suspense>
                </Route>
                <Redirect to="/examples/table/simple" />
            </Switch>
        </div>
    </HashRouter>
);

export default App;