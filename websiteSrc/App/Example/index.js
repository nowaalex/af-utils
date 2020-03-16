import React, { Fragment, Suspense } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/prism/vs-dark";
import { ComponentsMap } from "../routes";
import { css } from "@emotion/core";
import { useParams } from "react-router-dom";

SyntaxHighlighter.registerLanguage( "javascript", js );

const mainFieldCss = css`
    display: flex;
    flex: 1 1 auto;
    flex-flow: row nowrap;
    padding: 0.5em;
    min-height: 0;
`;

const codeCss = css`
    margin: 0 2em;
    font-size: 0.9em;
    flex: 0 2 auto;
    max-width: 40vw;
    display: flex;
`;

const Example = () => {
    const { example } = useParams();

    if( !ComponentsMap.hasOwnProperty( example ) ){
        return null;
    }

    const [ Component, code ] = ComponentsMap[ example ];

    return (
        <Fragment>
            <h2>Examples/{example}</h2>
            <div css={mainFieldCss}>
                <Suspense fallback="Loading example...">
                    <Component />
                    <div css={codeCss}>
                        <SyntaxHighlighter language="javascript" style={codeStyle}>
                            {code}
                        </SyntaxHighlighter>
                    </div>
                </Suspense>
            </div>
        </Fragment>
    );
}

export default Example;