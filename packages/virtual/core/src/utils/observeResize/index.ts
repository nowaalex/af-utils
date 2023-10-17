import FinalResizeObserver from "models/ResizeObserver";
import type { VirtualScrollerScrollElement } from "types";

const observeResize = (
    target: VirtualScrollerScrollElement,
    callback: () => void
) => {
    if (target instanceof HTMLElement) {
        const RO = new FinalResizeObserver(callback);
        RO.observe(target);
        return () => RO.disconnect();
    }
    // resizeObserver has required 1st call
    callback();
    addEventListener("resize", callback);
    return () => removeEventListener("resize", callback);
};

export default observeResize;
