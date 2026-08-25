import { virtualItem } from "@af-utils/virtual-svelte";

globalThis.__virtualCompatibility = Promise.resolve().then(() => {
    let attached = 0;
    let detached = 0;
    const model = {
        attachItem: () => attached++,
        detachItem: () => detached++
    };
    const element = document.createElement("div");
    const cleanup = virtualItem(model, 0)(element);

    if (attached !== 1)
        throw new Error("Svelte attachment did not attach the item");
    cleanup();
    if (detached !== 1)
        throw new Error("Svelte attachment did not detach the item");
    return true;
});
