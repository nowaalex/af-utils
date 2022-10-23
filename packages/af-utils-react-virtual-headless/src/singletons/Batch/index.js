import call from "src/utils/call";

const Queue = new Set();

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
    _queue: fn => Queue.add(fn)
};
