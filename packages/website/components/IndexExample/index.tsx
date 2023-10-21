"use client";

import Image from "next/image";
import List from "components/examples/react-examples/list/simple/code";

const IndexExample = () => (
    <div className="grid md:grid-cols-2 gap-8 not-prose max-w-screen-xl">
        <Image width={768} height={592} alt="messy" src="/messy.jpg" />
        <div className="overflow-hidden contain-strict grid md:h-full h-64">
            <List />
        </div>
    </div>
);

export default IndexExample;
