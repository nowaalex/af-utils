"use client";

import { useReducer } from "react";
import { createPortal } from "react-dom";

type IframeWrapperProps = JSX.IntrinsicElements["iframe"];

const reducer = (_: any, el: HTMLIFrameElement | null) => {
    const doc = el?.contentDocument ?? null;

    if (doc && !doc.head.childElementCount) {
        document.head
            .querySelectorAll("link[rel='stylesheet']")
            .forEach(node => doc.head.append(node.cloneNode()));

        doc.documentElement.className =
            document.documentElement.className + " prose";
        doc.body.className = "not-prose";
    }

    return doc;
};

const IframeWrapper = ({ children, ...props }: IframeWrapperProps) => {
    const [elDoc, setEl] = useReducer(reducer, null);

    return (
        <iframe ref={setEl} {...props}>
            {elDoc && createPortal(children, elDoc.body)}
        </iframe>
    );
};

export default IframeWrapper;
