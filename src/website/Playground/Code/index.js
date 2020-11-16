import { useEffect, useRef, memo } from "react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "highlight.js/styles/default.css";
import css from "./style.module.scss";

hljs.registerLanguage( "javascript", javascript );


const Code = ({ children }) => {    
    const ref = useRef();

    useEffect(() => {
        hljs.highlightBlock( ref.current );
    }, [ children ]);

    return (
        <code ref={ref} className={css.wrapper}>
            {children}
        </code>
    );
}


export default memo( Code );