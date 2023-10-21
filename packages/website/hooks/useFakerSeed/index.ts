import { useState, useEffect } from "react";
import { seed } from "@ngneat/falso";

const useFakerSeed = (seedNumber: number) => {
    useState(() => seed("" + seedNumber));
    useEffect(() => () => seed(), []);
};

export default useFakerSeed;
