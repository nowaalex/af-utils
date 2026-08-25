import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { useVirtualItemRef } from "@af-utils/virtual-react";

globalThis.__virtualCompatibility = Promise.resolve().then(() => {
    let attached = 0;
    let detached = 0;
    const model = {
        attachItem: () => attached++,
        detachItem: () => detached++
    };
    const host = document.querySelector("#root");
    const root = createRoot(host);
    const Item = () =>
        createElement("div", { ref: useVirtualItemRef(model, 0) });

    flushSync(() => root.render(createElement(Item)));
    if (attached !== 1) throw new Error("React ref did not attach the item");
    root.unmount();
    if (detached !== 1) throw new Error("React ref did not detach the item");
    return true;
});
