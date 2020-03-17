import React, { Fragment, Suspense } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/prism/vs-dark";
import { ComponentsMap } from "./routes";
import { css } from "@emotion/core";
import { useParams } from "react-router-dom";

SyntaxHighlighter.registerLanguage( "javascript", js );

const customStyle = {
    borderRadius: "none",
    margin: 0
};

const mainFieldCss = css`
    display: flex;
    flex: 1 1 auto;
    flex-flow: row nowrap;
    min-height: 0;

    @media(max-width:1024px){
        flex-flow: column nowrap;
    }
`;

const tableWrapperCss = css`
    display: flex;
    flex: 1 1 50%;
    flex-flow: column nowrap;
    min-height: 0;
`;

const codeCss = css`
    margin: 0 1em;
    font-size: 0.9em;
    flex: 1 2 auto;
    min-width: 15em;
    min-height: 0;
`;

const Example = () => {
    const { example } = useParams();

    if( !ComponentsMap.hasOwnProperty( example ) ){
        return <h3>Wrong example</h3>;
    }

    const [ Component, code ] = ComponentsMap[ example ];

    return (
        <Fragment>
            <h3>Examples/{example}</h3>
            <div css={mainFieldCss}>
                <Suspense fallback="Loading example...">
                    <div css={tableWrapperCss}>
                        <Component />
                    </div>
                    <SyntaxHighlighter css={codeCss} language="javascript" style={codeStyle} customStyle={customStyle}>
                        {code}
                    </SyntaxHighlighter>
                </Suspense>
            </div>
        </Fragment>
    );
}

export default Example;