"use client";

import Image from "next/image";

const GuillotineImage = () => (
    <Image
        width={239}
        height={276}
        alt="guillotine"
        src="/guillotine-small.jpg"
        className="pl-8 float-right mt-4 xl:block hidden mb-0"
    />
);

export default GuillotineImage;
