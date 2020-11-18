import { memo, Suspense } from "react";
import Code from "../Code";
import css from "./style.module.scss";

const Playground = ({ Example, code }) => {
    
    const { default: codeString } = code;

    return (
        <div className={css.wrapper}>
            <Suspense fallback="Loading example...">
                <Example />
            </Suspense>
            <Code>{codeString}</Code>
        </div>
    );
}

export default memo( Playground );