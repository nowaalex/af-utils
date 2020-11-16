import { memo, lazy, Suspense } from "react";
import css from "./style.module.scss";

const Code = lazy(() => import( "./Code" ));

const Playground = ({ example, code }) => {
    
    const { default: codeString } = code;
    const { default: Component } = example;

    return (
        <div className={css.wrapper}>
            <Component />
            <Suspense fallback="Loading code...">
                <Code>{codeString}</Code>
            </Suspense>
        </div>
    );
}

export default memo( Playground );