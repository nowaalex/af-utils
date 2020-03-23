import React from "react";
import { useParams } from "react-router-dom";
import { css } from "@emotion/core";
import Basic from "./basic";

const DocPages = {
    basic: Basic
};

const wrapperCss = css`
    text-align: left;
    margin-left: 1em;

    [data-required] {
        &:after{
            color: #780b0b;
            content: " (required)";
        }
    }
`;

const Docs = () => {
    const { docpage } = useParams();
    const PageComponent = docpage && DocPages[ docpage ];

    return PageComponent ? (
        <div css={wrapperCss}>
            <PageComponent />
        </div>
    ) : "Page not found";
};

export default Docs;