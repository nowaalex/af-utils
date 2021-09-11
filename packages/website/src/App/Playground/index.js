import { memo, Suspense } from "react";
import Code from "../../Code";

const Playground = ({ Example, className, code }) => {
    
    const { default: codeString } = code;

    return (
        <div className={className}>
            <Suspense fallback={<div>Loading example...</div>}>
                <Example />
            </Suspense>
            <Code>{codeString}</Code>
        </div>
    );
}

export default memo( Playground );