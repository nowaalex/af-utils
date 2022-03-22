class PubSub {
    /* Quantity of subarrays is hardcoded and equals events constants quantity */
    _EventsList = [[], [], []];

    /* Queue of callbacks, that should run after batch end */
    _Queue = new Set();

    /* depth of batch */
    _inBatch = 0;

    sub(callBack, deps) {
        for (const evt of deps) {
            this._EventsList[evt].push(callBack);
        }
    }

    unsub(callBack, deps) {
        for (const evt of deps) {
            this._EventsList[evt].splice(
                this._EventsList[evt].indexOf(callBack) >>> 0,
                1
            );
        }
    }

    _run(evt) {
        if (process.env.NODE_ENV !== "production") {
            if (this._inBatch === 0) {
                throw new Error("Can't run actions while not in batch");
            }
        }

        for (const cb of this._EventsList[evt]) {
            this._Queue.add(cb);
        }
    }

    /* inspired by mobx */

    _startBatch() {
        this._inBatch++;
    }

    _endBatch() {
        if (--this._inBatch === 0) {
            for (const cb of this._Queue) {
                /*
                    These callbacks must not call _startBatch from inside.
                */
                cb();
            }
            this._Queue.clear();
        }
    }
}

export default PubSub;
