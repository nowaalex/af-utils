"use client";

import Image from "next/image";
import List from "app/virtual/examples/list/Simple/page";

const IndexExample = () => (
    <div className="flex gap-8 not-prose">
        <Image width={768} height={592} alt="messy" src="/messy.jpg" />
        <div className="overflow-hidden contain-strict grid grow">
            <List />
        </div>
    </div>
);

export default IndexExample;
