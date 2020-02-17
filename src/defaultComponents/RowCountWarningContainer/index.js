import React from "react";
import { css } from "@emotion/core";

const wrapperCss = css`
    flex: 1 1 auto;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const RowCountWarningContainer = props => <div css={wrapperCss} {...props} />;

export default RowCountWarningContainer;