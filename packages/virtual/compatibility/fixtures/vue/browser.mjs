import { virtualItemDirective } from "@af-utils/virtual-vue";

globalThis.__virtualCompatibility = Promise.resolve().then(() => {
    let attached = 0;
    let detached = 0;
    const model = {
        attachItem: () => attached++,
        detachItem: () => detached++
    };
    const element = document.createElement("div");
    const binding = { value: [model, 0] };

    virtualItemDirective.mounted(element, binding);
    if (attached !== 1)
        throw new Error("Vue directive did not attach the item");
    virtualItemDirective.unmounted(element, binding);
    if (detached !== 1)
        throw new Error("Vue directive did not detach the item");
    return true;
});
