export interface PrivateFieldState {
    reset(seed: number): void;
    run(iterations: number, seed: number): number;
    step(input: number): number;
}

/**
 * TypeScript's `private` modifier is erased and these become ordinary
 * JavaScript properties at runtime.
 */
export class TypeScriptPrivateState implements PrivateFieldState {
    private itemCount: number;
    private from: number;
    private to: number;
    private estimatedSize: number;
    private totalSize: number;
    private scrollOffset: number;
    private revision: number;
    private direction: number;

    constructor(seed: number) {
        this.itemCount = 100_000 + seed;
        this.from = seed & 1_023;
        this.to = this.from + 32;
        this.estimatedSize = 40.25 + (seed & 3) * 0.25;
        this.totalSize = this.itemCount * this.estimatedSize;
        this.scrollOffset = seed + 0.5;
        this.revision = seed;
        this.direction = 1;
    }

    reset(seed: number) {
        this.itemCount = 100_000 + seed;
        this.from = seed & 1_023;
        this.to = this.from + 32;
        this.estimatedSize = 40.25 + (seed & 3) * 0.25;
        this.totalSize = this.itemCount * this.estimatedSize;
        this.scrollOffset = seed + 0.5;
        this.revision = seed;
        this.direction = 1;
    }

    step(input: number) {
        const delta = (input & 15) - 7;

        this.itemCount = (this.itemCount + (input & 1)) & 0x3fffffff;
        this.from = (this.from + 17 + (input & 1)) & 0xffff;
        this.to = this.from + 32;
        this.totalSize += this.estimatedSize + delta * 0.25;
        this.scrollOffset += delta * this.direction;
        if (this.scrollOffset < 0 || this.scrollOffset > 1_000_000) {
            this.direction = -this.direction;
            this.scrollOffset += delta * this.direction * 2;
        }
        this.revision = (this.revision + 1) & 0x3fffffff;

        return (
            this.totalSize +
            this.scrollOffset +
            this.from +
            this.to +
            this.itemCount +
            this.revision +
            this.direction
        );
    }

    run(iterations: number, seed: number) {
        let checksum = 0.0;

        for (let iteration = 0; iteration < iterations; iteration++) {
            checksum += this.step(iteration + seed);
        }

        return checksum;
    }
}

/** Native ECMAScript private fields with runtime brand checks. */
export class NativePrivateState implements PrivateFieldState {
    #itemCount: number;
    #from: number;
    #to: number;
    #estimatedSize: number;
    #totalSize: number;
    #scrollOffset: number;
    #revision: number;
    #direction: number;

    constructor(seed: number) {
        this.#itemCount = 100_000 + seed;
        this.#from = seed & 1_023;
        this.#to = this.#from + 32;
        this.#estimatedSize = 40.25 + (seed & 3) * 0.25;
        this.#totalSize = this.#itemCount * this.#estimatedSize;
        this.#scrollOffset = seed + 0.5;
        this.#revision = seed;
        this.#direction = 1;
    }

    reset(seed: number) {
        this.#itemCount = 100_000 + seed;
        this.#from = seed & 1_023;
        this.#to = this.#from + 32;
        this.#estimatedSize = 40.25 + (seed & 3) * 0.25;
        this.#totalSize = this.#itemCount * this.#estimatedSize;
        this.#scrollOffset = seed + 0.5;
        this.#revision = seed;
        this.#direction = 1;
    }

    step(input: number) {
        const delta = (input & 15) - 7;

        this.#itemCount = (this.#itemCount + (input & 1)) & 0x3fffffff;
        this.#from = (this.#from + 17 + (input & 1)) & 0xffff;
        this.#to = this.#from + 32;
        this.#totalSize += this.#estimatedSize + delta * 0.25;
        this.#scrollOffset += delta * this.#direction;
        if (this.#scrollOffset < 0 || this.#scrollOffset > 1_000_000) {
            this.#direction = -this.#direction;
            this.#scrollOffset += delta * this.#direction * 2;
        }
        this.#revision = (this.#revision + 1) & 0x3fffffff;

        return (
            this.#totalSize +
            this.#scrollOffset +
            this.#from +
            this.#to +
            this.#itemCount +
            this.#revision +
            this.#direction
        );
    }

    run(iterations: number, seed: number) {
        let checksum = 0.0;

        for (let iteration = 0; iteration < iterations; iteration++) {
            checksum += this.step(iteration + seed);
        }

        return checksum;
    }
}
