import { createRoot } from "solid-js";
import { createVirtualItemRef } from "@af-utils/virtual-solid";

globalThis.__virtualCompatibility = Promise.resolve().then(() => {
    let attached = 0;
    let detached = 0;
    const model = {
        attachItem: () => attached++,
        detachItem: () => detached++
    };
    const element = document.createElement("div");
    let dispose;

    createRoot(currentDispose => {
        dispose = currentDispose;
        createVirtualItemRef(model, 0)(element);
    });
    if (attached !== 1) throw new Error("Solid ref did not attach the item");
    dispose();
    if (detached !== 1) throw new Error("Solid ref did not detach the item");
    return true;
});
