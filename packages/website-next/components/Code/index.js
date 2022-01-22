import { useEffect, useRef } from "react";
import cx from "classnames";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import xml from "highlight.js/lib/languages/xml";
import "highlight.js/styles/googlecode.css";

hljs.registerLanguage( "javascript", javascript );
hljs.registerLanguage( "xml", xml );

const Code = ({ children, className }) => {    
    const ref = useRef();

    useEffect(() => {
        hljs.highlightElement( ref.current );
    }, [ children ]);

    return (
        <code ref={ref} className={cx("font-mono whitespace-pre",className)}>
            {children}
        </code>
    );
}

export default Code;