import { useLayoutEffect, useEffect } from "react";

export default process.env.__IS_SERVER__ ? useEffect : useLayoutEffect;
