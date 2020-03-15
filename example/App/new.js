import React from "react";
import startCase from "lodash/startCase";
import { css } from "@emotion/core";
import { BrowserRouter as Router, NavLink, Switch, Route } from "react-router-dom";
import { ComponentsMap, ExamplesMenu } from "./routes";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/prism/vs-dark";

SyntaxHighlighter.registerLanguage( "javascript", js );

const wrapperCss = css`
    display: flex;
    flex-flow: row nowrap;
    font-family: monospace;
    height: 100vh;
    width: 100vw;
`;

const mainFieldCss = css`
    flex: 1 1 auto;
    display: flex;
    flex-flow: row nowrap;
    padding: 0.5em;
    min-height: 0;
`;

const mainFieldWrapperCss = css`
    flex-grow: 1;
    display: flex;
    flex-flow: column nowrap;
    min-height: 0;
    text-align: center;
`;

const sidePaneCss = css`
    padding: 0.5em 1em;
    overflow: auto;
    flex: 0 0 auto;
    border-right: 2px solid rgb(30, 30, 30);
    background: #e3e3e3;
`;

const codeCss = css`
    margin: 0 2em;
    font-size: 0.9em;
    flex: 0 0 auto;
    overflow: auto;
`;

const ulWrapperCss = css`
    a {
        text-decoration: none;
        color: inherit;

        &:hover {
            text-decoration: underline;
        }

        &.active {
            color: darkgreen;
            font-weight: bold;
        }
    }

    ul {
        list-style-type: none;
        padding-inline-start: 1.5em;
    }
`;

const Ul = ({ name, children, className, hIndex }) => {

    const NameComponent = `h${hIndex}`;

    return (
        <div css={ulWrapperCss} className={className}>
            <NameComponent>{name}</NameComponent>
            <ul>
                {children.map(( r, i ) => (
                    <li key={i}>
                        {r.children ? (
                            <Ul {...r} hIndex={hIndex+1} />
                        ) : (
                            <NavLink to={r.path}>{startCase(r.name)}</NavLink>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

const renderExample = ({ match }) => {
    const { example } = match.params;

    if( !ComponentsMap.hasOwnProperty( example ) ){
        return null;
    }

    const [ Component, code ] = ComponentsMap[ example ];

    return (
        <div css={mainFieldWrapperCss}>
            <h2>Examples/{example}</h2>
            <div css={mainFieldCss}>
                <Component />
                <div css={codeCss}>
                    <SyntaxHighlighter language="javascript" style={codeStyle}>
                        {code}
                    </SyntaxHighlighter>
                </div> 
            </div>
        </div>
    );
}

const App = () => (
    <Router>
        <div css={wrapperCss}>
            <Ul name="Examples" css={sidePaneCss} hIndex={2}>
                {ExamplesMenu}
            </Ul>
            <Switch>
                <Route path="/examples/:example(.+)" render={renderExample} />
            </Switch>
        </div>
    </Router>
);

export default App;