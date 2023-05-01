import FinalResizeObserver from "models/ResizeObserver";
import isElement from "utils/isElement";

const observeResize = (target: Element | Window, callback: () => void) => {
    if (isElement(target)) {
        const RO = new FinalResizeObserver(callback);
        RO.observe(target as Element);
        return () => RO.disconnect();
    }
    // resizeObserver has required 1st call
    callback();
    target.addEventListener("resize", callback);
    return () => target.removeEventListener("resize", callback);
};

export default observeResize;
