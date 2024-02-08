"use client";

import Image from "next/image";
import imgSrc from "public/messy.jpg";
import List from "../../../virtual/examples/react/list/simple/src/code";

const IndexExample = () => (
    <div className="grid md:grid-cols-2 gap-8 not-prose max-w-screen-xl">
        <Image
            priority
            alt="Messy room with only webcam-visible piece cleaned"
            src={imgSrc}
        />
        <div className="overflow-hidden contain-strict grid md:h-full h-64">
            <List />
        </div>
    </div>
);

export default IndexExample;
