import FinalResizeObserver from "models/ResizeObserver";

const observeResize = (target: HTMLElement | Window, callback: () => void) => {
    if (target instanceof Window) {
        window.addEventListener("resize", callback);
        return () => window.removeEventListener("resize", callback);
    }
    const RO = new FinalResizeObserver(callback);
    RO.observe(target);
    return () => RO.disconnect();
};

export default observeResize;
