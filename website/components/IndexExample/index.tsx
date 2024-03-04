"use client";

import Image from "next/image";
import imgSrc from "public/messy.jpg";
import List from "@af-utils/examples/src/virtual/react/list/simple/src/code";

const IndexExample = () => (
    <div className="not-prose grid max-w-screen-xl gap-8 md:grid-cols-2">
        <Image
            priority
            alt="Messy room with only webcam-visible piece cleaned"
            src={imgSrc}
        />
        <div className="contain-strict grid h-64 overflow-hidden md:h-full">
            <List />
        </div>
    </div>
);

export default IndexExample;
