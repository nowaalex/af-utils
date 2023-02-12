import { seed } from "@ngneat/falso";
import { useRef } from "react";

const useFakerSeed = seedNumber => (useRef().current ||= seed(seedNumber));

export default useFakerSeed;
