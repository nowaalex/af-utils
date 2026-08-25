import { html, nothing, render } from "lit";
import { virtualItem } from "@af-utils/virtual-lit";

globalThis.__virtualCompatibility = Promise.resolve().then(() => {
    let attached = 0;
    let detached = 0;
    const model = {
        attachItem: () => attached++,
        detachItem: () => detached++
    };
    const host = document.querySelector("#root");

    render(html`<div ${virtualItem(model, 0)}></div>`, host);
    if (attached !== 1)
        throw new Error("Lit directive did not attach the item");
    render(nothing, host);
    if (detached !== 1)
        throw new Error("Lit directive did not detach the item");
    return true;
});
