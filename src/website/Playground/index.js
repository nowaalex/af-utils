import { memo } from "react";
import Code from "../Code";
import css from "./style.module.scss";

const Playground = ({ example, code }) => {
    
    const { default: codeString } = code;
    const { default: Component } = example;

    return (
        <div className={css.wrapper}>
            <Component />
            <Code>{codeString}</Code>
        </div>
    );
}

export default memo( Playground );