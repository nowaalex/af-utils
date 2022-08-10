import { seed } from "@ngneat/falso";
import { useRef } from "react";

const useFakerSeed = seedNumber => {
    const v = useRef();
    v.current ||= seed(seedNumber);
};

export default useFakerSeed;
