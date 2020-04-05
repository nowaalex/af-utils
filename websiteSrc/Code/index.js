import React from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/prism/vs-dark";
import { css } from "@emotion/core";

SyntaxHighlighter.registerLanguage( "javascript", js );

const customStyle = {
    borderRadius: "none",
    margin: 0
};

const codeCss = css`
    font-size: 0.9em;
`;

const Code = props => (
    <SyntaxHighlighter
        css={codeCss}
        language="javascript"
        style={codeStyle}
        customStyle={customStyle}
        {...props}
    />
);

export default Code;