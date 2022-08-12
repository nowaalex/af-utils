import call from "/utils/call";

const Queue = new Set();

export default {
    _level: 0,
    _start() {
        this._level++;
    },
    _end() {
        if (--this._level === 0) {
            /*
                 calls must not call _startBatch from inside.
            */
            Queue.forEach(call);
            Queue.clear();
        }
    },
    _queue: fn => Queue.add(fn)
};
