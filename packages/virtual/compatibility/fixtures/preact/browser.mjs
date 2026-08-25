import { h, render } from "preact";
import { useVirtualItemRef } from "@af-utils/virtual-preact";

globalThis.__virtualCompatibility = Promise.resolve().then(() => {
    let attached = 0;
    let detached = 0;
    const model = {
        attachItem: () => attached++,
        detachItem: () => detached++
    };
    const host = document.querySelector("#root");
    const Item = () => h("div", { ref: useVirtualItemRef(model, 0) });

    render(h(Item), host);
    if (attached !== 1) throw new Error("Preact ref did not attach the item");
    render(null, host);
    if (detached !== 1) throw new Error("Preact ref did not detach the item");
    return true;
});
