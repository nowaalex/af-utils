"use client";

import Image from "next/image";
import List from "app/virtual/examples/list/Simple/page";

const IndexExample = () => (
    <div className="grid gap-8 lg:grid-cols-[5fr_3fr]">
        <Image
            width={768}
            height={592}
            alt="messy"
            src="/messy.jpg"
            className="my-0"
        />
        <div className="shadow-lg h-[30vh] lg:h-auto relative">
            <div className="absolute inset-0">
                <List />
            </div>
        </div>
    </div>
);

export default IndexExample;
