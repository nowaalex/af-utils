import { describe, expect, test } from "vitest";

import { createRuntimeEventRecorder, mergeRuntimeEvents } from "./index.js";

const event = {
    streamId: "measurement",
    purpose: "measurement" as const,
    phase: "setup" as const,
    kind: "phase-start" as const,
    source: "worker-lifecycle" as const,
    correlation: "phase" as const,
    message: "setup started"
};

describe("runtime event timeline", () => {
    test("assigns stable sequence numbers", () => {
        const recorder = createRuntimeEventRecorder();
        recorder.add(event);
        recorder.add({ ...event, message: "setup finished" });
        expect(recorder.events.map(item => item.sequence)).toEqual([0, 1]);
    });

    test("does not invent chronology across processes", () => {
        expect(
            mergeRuntimeEvents(
                [{ ...event, sequence: 9 }],
                [{ ...event, sequence: 40 }]
            ).map(item => item.sequence)
        ).toEqual([9, 40]);
    });
});
