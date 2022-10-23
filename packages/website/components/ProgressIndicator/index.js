import { memo, useEffect, useState } from "react";
import { useRouter } from "next/router";

const ProgressIndicator = () => {
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const handleStart = () => setLoading(true);
        const handleStop = () => setLoading(false);

        router.events.on("routeChangeStart", handleStart);
        router.events.on("routeChangeComplete", handleStop);
        router.events.on("routeChangeError", handleStop);

        return () => {
            router.events.off("routeChangeStart", handleStart);
            router.events.off("routeChangeComplete", handleStop);
            router.events.off("routeChangeError", handleStop);
        };
    }, [router]);

    return loading ? (
        <div className="w-full fixed top-0 h-1 z-50 overflow-hidden bg-gray-400">
            <div
                role="progressbar"
                aria-valuenow="50"
                aria-valuemin="0"
                aria-valuemax="100"
                className="h-full absolute bg-blue-700 top-0 progressbar"
            ></div>
        </div>
    ) : null;
};

export default memo(ProgressIndicator);
