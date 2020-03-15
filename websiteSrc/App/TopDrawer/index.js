import React, { useState } from "react";
import { css } from "@emotion/core";

const childrenWrapper = css`
    max-height: 50vh;
    overflow: auto;
`;

const closedTogglerCss = css`
    text-align: center;
    padding: 0.2rem;
    border-bottom: 2px solid #666;
    background: #e3e3e3;
    cursor: pointer;
    font-size: 2rem;
    &:hover {
        background: #c3c3c3;
    }
`;

const openedTogglerCss = css`
    ${closedTogglerCss};
    border-top: 2px solid #666;
`;

const negate = v => !v;

const TopDrawer = ({ children, ...props }) => {
    const [ isOpened, setOpened ] = useState( true );

    return (
        <div {...props}>
            { isOpened ? (
                <div css={childrenWrapper}>
                    {children}
                </div>
            ) : null }
            <div
                title={isOpened?"Collapse":"Expand"}
                css={isOpened?openedTogglerCss:closedTogglerCss}
                onClick={() => setOpened( negate )}
            >
                {isOpened?"\u21A5":"\u21A7"}
            </div>
        </div>
    );
};

export default TopDrawer;