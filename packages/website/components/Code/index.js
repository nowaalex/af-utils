import { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-jsx";

const Code = ({ children }) => {    
    const ref = useRef();

    useEffect(() => {
        Prism.highlightElement( ref.current );
    }, [ children ]);

    return (
        <code ref={ref} className="language-jsx">
            {children}
        </code>
    );
}

export default Code;