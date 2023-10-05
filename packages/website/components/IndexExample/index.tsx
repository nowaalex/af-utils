"use client";

import Image from "next/image";
import List from "app/virtual/examples/list/Simple/page";

const IndexExample = () => (
    <div className="grid gap-8 lg:grid-cols-[5fr_3fr] not-prose">
        <Image width={768} height={592} alt="messy" src="/messy.jpg" />
        <div className="overflow-hidden contain-strict grid">
            <List />
        </div>
    </div>
);

export default IndexExample;
