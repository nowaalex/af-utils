import throttle from "lodash/throttle";
import { useMemo, useEffect } from "react";

const useThrottledCallback = (callback, interval, depsArray) => {
	const fn = useMemo(() => throttle(callback, interval), depsArray);
	useEffect(() => () => fn.cancel(), depsArray);
	return fn;
};

export default useThrottledCallback;
