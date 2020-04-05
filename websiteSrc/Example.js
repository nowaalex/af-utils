import React, { Suspense } from "react";
import { ComponentsMap } from "./routes";
import { css } from "@emotion/core";
import { useParams } from "react-router-dom";
import Code from "./Code";

const mainFieldCss = css`
    display: flex;
    flex: 1 1 auto;
    flex-flow: row nowrap;
    min-height: 0;

    @media(max-width:1024px){
        flex-flow: column nowrap;
    }
`;

/*
    TODO:
        emotion gives more specificity to default styles. This && should be removed.
*/
const tableWrapperCss = css`
    && {
        flex: 1 1 50%;
        min-height: 6em;
    }
`;

const codeCss = css`
    margin: 0 1em;
    flex: 1 1 30%;
    min-width: 15em;
    min-height: 0;
`;

const Example = () => {
    const { example } = useParams();

    if( !ComponentsMap.hasOwnProperty( example ) ){
        return "Wrong example";
    }

    const [ Component, code ] = ComponentsMap[ example ];

    return (
        <div css={mainFieldCss}>
            <Suspense fallback="Loading example...">
                <Component css={tableWrapperCss} />
                <Code css={codeCss}>
                    {code}
                </Code>
            </Suspense>
        </div>
    );
}

export default Example;