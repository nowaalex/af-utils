import FinalResizeObserver from "models/ResizeObserver";
import type { ScrollElement } from "types";

const observeResize = (target: ScrollElement, callback: () => void) => {
    if (target instanceof Element) {
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
