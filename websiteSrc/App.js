import React, { Suspense, lazy } from "react";
import { css, Global } from "@emotion/core";
/* App is deployed to github pages, so BrowserRouter would not work there */
import { HashRouter, Switch, Route, Redirect } from "react-router-dom";

const Menu = lazy(() => import( "./Menu" ));
const Example = lazy(() => import( "./Example" ));

if( !ASSETS_PATH ){
    throw new Error( `ASSETS_PATH should be passed` );
}

const globalCss = css`
    html, body, #root {
        height: 100%;
    }
`;

const growCss = css`
    flex: 1 1 auto;
`;

const wrapperCss = css`
    display: flex;
    flex-flow: row nowrap;
    font-family: monospace;
    height: 100%;

    @media(max-width: 900px){
        flex-flow: column nowrap;
    }
`;

const mainFieldWrapperCss = css`
    ${growCss};
    display: flex;
    flex-flow: column nowrap;
    min-height: 0;
    min-width: 0;
    text-align: center;
    overflow: hidden;
`;

const App = () => (
    <HashRouter basename={ASSETS_PATH}>
        <Global styles={globalCss} />
        <div css={wrapperCss}>
            <Suspense fallback="Loading menu...">
                <Menu />
            </Suspense>
            <div css={mainFieldWrapperCss}>
                <Switch>
                    <Route path="/examples/:example(.+)">
                        <Suspense fallback="Loading Examples container...">
                            <Example />
                        </Suspense>
                    </Route>
                    <Route path="/misc/bundle">
                        <h2>Misc/bundle</h2>
                        <iframe css={growCss} src={`${ASSETS_PATH}bundle.html`} />
                    </Route>
                    <Redirect to="/examples/table/simple" />
                </Switch>
            </div>
        </div>
    </HashRouter>
);

export default App;