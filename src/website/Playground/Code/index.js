import { useEffect, useRef, memo } from "react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import xml from "highlight.js/lib/languages/xml";
import "highlight.js/styles/vs2015.css";
import css from "./style.module.scss";

hljs.registerLanguage( "javascript", javascript );
hljs.registerLanguage( "xml", xml );

/*
    TODO:
        highlight.js works badly with jsx. Maybe switch to prism?
*/

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