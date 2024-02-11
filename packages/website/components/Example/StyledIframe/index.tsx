"use client";

import { ComponentPropsWithoutRef } from "react";

const add = (el: HTMLIFrameElement) => {
    const links = el.ownerDocument.head.querySelectorAll("link");

    for (const fontEl of links) {
        const cloned = fontEl.cloneNode(true);
        el.contentDocument!.head.append(cloned);
    }

    const styles = window.getComputedStyle(el.ownerDocument.documentElement);

    el.contentDocument!.body.style.fontFamily = styles.fontFamily;
};

const inheritStuff = (el: HTMLIFrameElement | null) => {
    if (el?.contentDocument) {
        console.log(el.contentDocument.readyState, document.readyState);
        add(el);
    }
};

const StyledIframe = (props: ComponentPropsWithoutRef<"iframe">) => (
    <iframe {...props} ref={inheritStuff} />
);

export default StyledIframe;
