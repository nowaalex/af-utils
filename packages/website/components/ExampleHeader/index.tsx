"use client";

import startCase from "lodash/startCase";
import { usePathname } from "next/navigation";

const ExampleHeader = () => {
    const segments = usePathname()
        .replace("examples", "example")
        .split("/")
        .slice(2)
        .map(startCase);

    return (
        <h1>
            {segments[0]}: {segments[2]} ({segments[1]})
        </h1>
    );
};

export default ExampleHeader;
