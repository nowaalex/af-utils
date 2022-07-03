import { faker } from "@faker-js/faker";
import { useRef } from "react";

const useFakerSeed = seedNumber => {
    const v = useRef();
    v.current ||= faker.seed(seedNumber);
};

export default useFakerSeed;
