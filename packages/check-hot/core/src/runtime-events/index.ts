import type {
    HotRuntimeEvent,
    HotRuntimeEvent as RuntimeEvent
} from "../types.js";

type RuntimeEventInput = Omit<RuntimeEvent, "sequence">;

/** Create a process-local event recorder with stable monotonic ordering. */
export const createRuntimeEventRecorder = () => {
    const events: HotRuntimeEvent[] = [];
    return {
        /** Append one normalized event and assign its sequence. */
        add(event: RuntimeEventInput) {
            events.push({ ...event, sequence: events.length });
        },
        /** Return the mutable process-owned list for final serialization. */
        get events(): readonly HotRuntimeEvent[] {
            return events;
        }
    };
};

/** Concatenate event streams without inventing a cross-process chronology. */
export const mergeRuntimeEvents = (
    ...streams: readonly (readonly HotRuntimeEvent[])[]
): readonly HotRuntimeEvent[] => streams.flat();
