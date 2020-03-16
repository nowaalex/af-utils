import React, { Suspense, lazy } from "react";
import { css } from "@emotion/core";
/* App is deployed to github pages, so BrowserRouter would not work there */
import { HashRouter, Switch, Route } from "react-router-dom";
import { ExamplesMenu } from "./routes";

const MenuList = lazy(() => import( "./MenuList" ));
const Example = lazy(() => import( "./Example" ));

if( !ASSETS_PATH ){
    throw new Error( `ASSETS_PATH should be passed` );
}

const Menu = [
    {
        name: "Examples",
        children: ExamplesMenu
    },
    {
        name: "Misc",
        children: [
            {
                name: "Bundle analyzer",
                path: "/misc/bundle"
            }
        ]
    }
];

const growCss = css`
    flex: 1 1 auto;
`;

const wrapperCss = css`
    display: flex;
    flex-flow: row nowrap;
    font-family: monospace;
    height: 100vh;
    width: 100vw;
`;

const mainFieldWrapperCss = css`
    flex-grow: 1;
    display: flex;
    overflow: hidden;
    flex-flow: column nowrap;
    min-height: 0;
    text-align: center;
`;

const sidePaneCss = css`
    padding: 0.5em 1em 0.5em 0;
    overflow: auto;
    flex: 0 0 auto;
    border-right: 2px solid rgb(30, 30, 30);
    background: #e3e3e3;
`;

const App = () => (
    <HashRouter basename={ASSETS_PATH}>
        <div css={wrapperCss}>
            <Suspense fallback="Loading menu...">
                <MenuList css={sidePaneCss} hIndex={1}>
                    {Menu}
                </MenuList>
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
                </Switch>
            </div>
        </div>
    </HashRouter>
);

export default App;