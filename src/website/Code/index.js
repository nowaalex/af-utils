import { useEffect, useRef, memo } from "react";
import cx from "utils/cx";
import hljs from "highlight.js";
import "highlight.js/styles/vs2015.css";
import css from "./style.module.scss";

const Code = ({ children, className }) => {    
    const ref = useRef();

    useEffect(() => {
        hljs.highlightBlock( ref.current );
    }, [ children ]);

    return (
        <code ref={ref} className={cx(css.wrapper,className)}>
            {children}
        </code>
    );
}


export default memo( Code );