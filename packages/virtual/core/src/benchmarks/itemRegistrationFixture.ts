import { createElement, useCallback, type RefCallback } from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";

const ATTRIBUTE_NAMES = {
    horizontal: "data-afv-col",
    vertical: "data-afv-row"
} as const;
const ITEM_COUNT = 64;
const UPDATES_PER_ROUND = 500;
const WARMUP_ROUNDS = 5;
const MEASURED_ROUNDS = 15;
const OBSERVE_OPTIONS = {
    box: "border-box"
} as const satisfies ResizeObserverOptions;

type BenchmarkStrategy = "refs" | keyof typeof ATTRIBUTE_NAMES;
type BenchmarkScenario =
    | "keyed boundary shift"
    | "disjoint keyed range"
    | "recycled slots"
    | "mount/unmount range";

interface ItemRegistry {
    readonly attributeName: string | null;
    /** Attach one item through the callback-ref path. */
    attach(element: HTMLElement, index: number): void;
    /** Detach an item from index and resize observation. */
    detach(element: HTMLElement): void;
    /** Return the next MutationObserver delivery or no wait for refs. */
    expectMutationDelivery(): Promise<void> | null;
    /** Resolve indexes for targets awaiting their initial measurement. */
    readPendingMeasurements(): number;
    /** Disconnect observers owned by this benchmark registry. */
    dispose(): void;
}

interface ItemProps {
    readonly index: number;
    readonly registry: ItemRegistry;
}

interface ScenarioFixture {
    /** Commit the initial rendered range. */
    initialize(): Promise<void>;
    /** Commit and measure one scenario update. */
    run(): Promise<void>;
    /** Unmount React and release the fixture DOM. */
    dispose(): void;
}

export interface ItemRegistrationBenchmarkResult {
    readonly scenario: BenchmarkScenario;
    readonly refs: number;
    readonly vertical: number;
    readonly horizontal: number;
}

let numericSink = 0;

const median = (values: readonly number[]) => {
    const sorted = values.toSorted((a, b) => a - b);
    return sorted[sorted.length >> 1];
};

const RefItem = ({ index, registry }: ItemProps) => {
    const ref: RefCallback<HTMLDivElement> = useCallback(
        element => {
            if (element) {
                registry.attach(element, index);
                return () => registry.detach(element);
            }
        },
        [index, registry]
    );

    return createElement("div", { ref }, index);
};

const AttributeItem = ({ index, registry }: ItemProps) =>
    createElement("div", { [registry.attributeName as string]: index }, index);

const createItemRegistry = (
    strategy: BenchmarkStrategy,
    container: HTMLElement
): ItemRegistry => {
    const resizeObserver = new ResizeObserver(() => {});
    const pendingMeasurements = new Set<HTMLElement>();
    const elementIndexes = new WeakMap<HTMLElement, number>();
    const attributeName =
        strategy === "refs" ? null : ATTRIBUTE_NAMES[strategy];
    let resolveMutationDelivery: (() => void) | null = null;

    const observe = (element: HTMLElement, reset: boolean) => {
        if (reset) resizeObserver.unobserve(element);
        resizeObserver.observe(element, OBSERVE_OPTIONS);
        pendingMeasurements.add(element);
    };
    const detach = (element: HTMLElement) => {
        elementIndexes.delete(element);
        pendingMeasurements.delete(element);
        resizeObserver.unobserve(element);
    };
    const mutationObserver = attributeName
        ? new MutationObserver(records => {
              for (const record of records) {
                  if (record.type === "attributes") {
                      const element = record.target as HTMLElement;
                      if (element.parentElement === container) {
                          observe(element, true);
                      }
                      continue;
                  }

                  for (const node of record.removedNodes) {
                      if (node instanceof HTMLElement) detach(node);
                  }
                  for (const node of record.addedNodes) {
                      if (
                          node instanceof HTMLElement &&
                          node.parentElement === container
                      ) {
                          observe(node, false);
                      }
                  }
              }

              resolveMutationDelivery?.();
              resolveMutationDelivery = null;
          })
        : null;

    if (mutationObserver && attributeName) {
        mutationObserver.observe(container, {
            attributeFilter: [attributeName],
            attributes: true,
            childList: true,
            subtree: true
        });
    }

    return {
        attributeName,
        attach(element, index) {
            elementIndexes.set(element, index);
            observe(element, false);
        },
        detach,
        expectMutationDelivery() {
            if (!mutationObserver) return null;
            return new Promise(resolve => {
                resolveMutationDelivery = resolve;
            });
        },
        readPendingMeasurements() {
            let checksum = 0;
            if (attributeName) {
                for (const element of pendingMeasurements) {
                    checksum += Number(element.getAttribute(attributeName));
                }
            } else {
                for (const element of pendingMeasurements) {
                    checksum += elementIndexes.get(element) ?? -1;
                }
            }
            pendingMeasurements.clear();
            return checksum;
        },
        dispose() {
            mutationObserver?.disconnect();
            resizeObserver.disconnect();
            pendingMeasurements.clear();
        }
    };
};

const createScenarioFixture = (
    strategy: BenchmarkStrategy,
    scenario: BenchmarkScenario
): ScenarioFixture => {
    const container = document.createElement("div");
    container.style.cssText =
        "position:fixed;inset:0;visibility:hidden;contain:strict;overflow:hidden";
    document.body.append(container);

    const registry = createItemRegistry(strategy, container);
    const root: Root = createRoot(container);
    const Item = strategy === "refs" ? RefItem : AttributeItem;
    let start = 0;
    let mounted = true;

    const render = () => {
        const indexes = mounted
            ? Array.from({ length: ITEM_COUNT }, (_, offset) => start + offset)
            : [];
        root.render(
            indexes.map((index, position) =>
                createElement(Item, {
                    index,
                    key: scenario === "recycled slots" ? position : index,
                    registry
                })
            )
        );
    };

    const commit = async () => {
        const mutationDelivery = registry.expectMutationDelivery();
        flushSync(render);
        if (mutationDelivery) await mutationDelivery;
        else await Promise.resolve();
        numericSink += registry.readPendingMeasurements();
    };

    const updateState = () => {
        switch (scenario) {
            case "keyed boundary shift":
                start++;
                break;
            case "disjoint keyed range":
            case "recycled slots":
                start = start === 0 ? 100_000 : 0;
                break;
            case "mount/unmount range":
                mounted = !mounted;
                break;
        }
    };

    return {
        initialize: commit,
        async run() {
            updateState();
            await commit();
        },
        dispose() {
            flushSync(() => root.unmount());
            registry.dispose();
            container.remove();
        }
    };
};

const measureFixture = async (fixture: ScenarioFixture) => {
    const start = performance.now();
    for (let update = 0; update < UPDATES_PER_ROUND; update++) {
        // oxlint-disable-next-line eslint/no-await-in-loop -- Every real React commit and MutationObserver delivery is one measured update.
        await fixture.run();
    }
    return ((performance.now() - start) * 1_000) / UPDATES_PER_ROUND;
};

const runScenario = async (
    scenario: BenchmarkScenario
): Promise<ItemRegistrationBenchmarkResult> => {
    const strategies: readonly BenchmarkStrategy[] = [
        "refs",
        "vertical",
        "horizontal"
    ];
    const fixtures = strategies.map(strategy =>
        createScenarioFixture(strategy, scenario)
    );

    for (let fixture = 0; fixture < fixtures.length; fixture++) {
        // oxlint-disable-next-line eslint/no-await-in-loop -- Initial commits run sequentially so observer deliveries cannot overlap.
        await fixtures[fixture].initialize();
    }
    for (let round = 0; round < WARMUP_ROUNDS; round++) {
        for (let offset = 0; offset < fixtures.length; offset++) {
            const index = (round + offset) % fixtures.length;
            // oxlint-disable-next-line eslint/no-await-in-loop -- Strategies share one browser thread and must run without contention.
            await measureFixture(fixtures[index]);
        }
    }

    const timings = fixtures.map(() => [] as number[]);
    for (let round = 0; round < MEASURED_ROUNDS; round++) {
        for (let offset = 0; offset < fixtures.length; offset++) {
            const index = (round + offset) % fixtures.length;
            // oxlint-disable-next-line eslint/no-await-in-loop -- Rotated sequential execution avoids CPU contention and fixed-order bias.
            timings[index].push(await measureFixture(fixtures[index]));
        }
    }
    for (const fixture of fixtures) fixture.dispose();

    return {
        scenario,
        refs: median(timings[0]),
        vertical: median(timings[1]),
        horizontal: median(timings[2])
    };
};

export const runItemRegistrationBenchmark = async () => {
    const results: ItemRegistrationBenchmarkResult[] = [];
    for (const scenario of [
        "keyed boundary shift",
        "disjoint keyed range",
        "recycled slots",
        "mount/unmount range"
    ] as const) {
        // oxlint-disable-next-line eslint/no-await-in-loop -- Scenarios run sequentially so their React roots and observers cannot interfere.
        results.push(await runScenario(scenario));
    }

    void numericSink;
    return results;
};
