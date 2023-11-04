import { useState, useEffect } from "react";
import { seed } from "@ngneat/falso";

const useFakerSeed = () => {
    useState(() => seed("seed"));
    useEffect(() => () => seed(), []);
};

export default useFakerSeed;
