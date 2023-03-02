import FinalResizeObserver from "models/ResizeObserver";

const observeResize = (target: Element | Window, callback: () => void) => {
    if (target instanceof Element) {
        const RO = new FinalResizeObserver(callback);
        RO.observe(target);
        return () => RO.disconnect();
    }
    // resizeObserver has required 1st call
    callback();
    target.addEventListener("resize", callback);
    return () => target.removeEventListener("resize", callback);
};

export default observeResize;
