// This should be imported only once in the project root
// oxlint-disable-next-line import/no-unassigned-import -- Importing installs the scrollend polyfill globally.
import "@af-utils/scrollend-polyfill";

import { useEffect, useRef } from "react";

const ReactExample = () => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = () => {
            console.log("scollend");
        };

        ref.current?.addEventListener("scrollend", handler);

        return () => ref.current?.removeEventListener("scrollend", handler);
    }, []);

    return (
        <div
            ref={ref}
            data-testid="scrollend-scroller"
            style={{ overflow: "auto", height: 200 }}
        >
            <div
                style={{
                    height: 1000,
                    padding: 10,
                    background: "lightgreen",
                    textAlign: "center"
                }}
            >
                Scroll me
            </div>
        </div>
    );
};

export default ReactExample;
