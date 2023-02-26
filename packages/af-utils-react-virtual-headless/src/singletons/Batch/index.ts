import call from "utils/call";

const Queue = new Set<() => void>();

export default {
    _level: 0,
    _start() {
        this._level++;
    },
    _end() {
        if (--this._level === 0) {
            Queue.forEach(call);
            Queue.clear();
        }
    },
    _queue: (fn: () => void) => Queue.add(fn)
};
