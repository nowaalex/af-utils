import { faker } from "@faker-js/faker";
import { useRef } from "react";

const useFakerSeed = seedNumber => {
    const v = useRef();
    if (!v.current) {
        v.current = faker.seed(seedNumber);
    }
};

export default useFakerSeed;
