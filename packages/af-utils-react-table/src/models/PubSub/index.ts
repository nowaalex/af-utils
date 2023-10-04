abstract class PubSub {
    private _Subscribers = new Set<() => void>();

    on = (cb: () => void) => {
        this._Subscribers.add(cb);
        return () => this._Subscribers.delete(cb);
    };

    run() {
        for (const cb of this._Subscribers) {
            cb();
        }
    }
}

export default PubSub;
