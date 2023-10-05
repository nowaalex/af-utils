import { seed } from "@ngneat/falso";

let seeded = false;

const useFakerSeed = (seedNumber: number) => {
    if (!seeded) {
        seed("" + seedNumber);
        seeded = true;
    }
};

export default useFakerSeed;
