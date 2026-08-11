import { useLayoutEffect, useEffect } from "react";

/** Use layout effects in a browser and passive effects during SSR. */
export default typeof window !== "undefined" ? useLayoutEffect : useEffect;
