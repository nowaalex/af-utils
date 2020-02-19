import React from "react";
import { css, cx } from "emotion";

const wrapperClass = css`
    flex: 1 1 auto;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const RowCountWarningContainer = ({ className, ...props }) => <div className={cx(wrapperClass,className)} {...props} />;

export default RowCountWarningContainer;