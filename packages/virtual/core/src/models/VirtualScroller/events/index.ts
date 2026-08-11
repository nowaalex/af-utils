import {
    VirtualScrollerEvent,
    type VirtualScrollerEventMask
} from "../../../constants";
import { assert } from "#virtual-errors";
import { VirtualScrollerErrorIndex } from "../../../errors/codes";

/** Tuple position used for the `RANGE` event revision. */
const RANGE_EVENT_INDEX = 0;

/** Tuple position used for the `SCROLL_SIZE` event revision. */
const SCROLL_SIZE_EVENT_INDEX = 1;

/** Tuple position used for the `SIZES` event revision. */
const SIZES_EVENT_INDEX = 2;

type Listener = () => void;

interface Subscription {
    callback: Listener;
    events: VirtualScrollerEventMask;
}

const NOOP_EVENT_LISTENER = () => {};

/**
 * Seed the list with an object before clearing it so an empty dispatcher and a
 * subscribed dispatcher retain the same packed-elements representation.
 */
const createSubscriptionList = () => {
    // Stryker disable next-line ArrayDeclaration: the observable difference is the V8 elements kind checked by jit:check.
    const subscriptions: Subscription[] = [
        // Stryker disable next-line ObjectLiteral: the seed's fields are never read; only its V8 elements kind is checked by jit:check.
        { callback: NOOP_EVENT_LISTENER, events: 0 }
    ];
    subscriptions.length = 0;
    return subscriptions;
};

/** Synchronous revisioned event dispatcher used by `VirtualScroller`. */
class VirtualScrollerEvents {
    /** Nesting depth of synchronous event batches. */
    private _batchLevel = 0;

    /** Event flags coalesced until the outer event batch ends. */
    private _batchedEvents = 0;

    /** One record per subscription, regardless of how many flags it selects. */
    private _subscriptions = createSubscriptionList();

    /** Latest global revision emitted for each public event category. */
    private _eventRevisions: [number, number, number] = [0, 0, 0];

    /** Monotonically increasing revision shared by all event categories. */
    private _revision = 0;

    /** Stable facade hook run after outer-batch subscribers have updated DOM. */
    private _onBatchEnd: Listener;

    /** Create a dispatcher with an optional outer-batch completion hook. */
    constructor(onBatchEnd: Listener = NOOP_EVENT_LISTENER) {
        this._onBatchEnd = onBatchEnd;
    }

    /** Whether at least one event batch is currently open. */
    get _batching() {
        return this._batchLevel > 0;
    }

    /** Subscribe one callback to the selected public event flags. */
    _subscribe(
        callback: Listener,
        events: VirtualScrollerEventMask = VirtualScrollerEvent.ALL
    ) {
        const subscription = { callback, events };
        this._subscriptions.push(subscription);

        return () => {
            const subscriptions = this._subscriptions;
            const position = subscriptions.indexOf(subscription);
            if (position !== -1) {
                // Copy-on-write keeps an active dispatch on its original snapshot.
                const nextSubscriptions = subscriptions.slice();
                nextSubscriptions.splice(position, 1);
                this._subscriptions = nextSubscriptions;
            }
        };
    }

    /** Return the newest revision among the selected event flags. */
    _getRevision(events: VirtualScrollerEventMask = VirtualScrollerEvent.ALL) {
        let revision = 0;
        if (events & VirtualScrollerEvent.RANGE) {
            revision = this._eventRevisions[RANGE_EVENT_INDEX];
        }
        if (
            events & VirtualScrollerEvent.SCROLL_SIZE &&
            // Stryker disable next-line EqualityOperator: events from one batch can share a revision, which leaves the selected maximum unchanged.
            this._eventRevisions[SCROLL_SIZE_EVENT_INDEX] > revision
        ) {
            revision = this._eventRevisions[SCROLL_SIZE_EVENT_INDEX];
        }
        if (
            events & VirtualScrollerEvent.SIZES &&
            // Stryker disable next-line EqualityOperator: events from one batch can share a revision, which leaves the selected maximum unchanged.
            this._eventRevisions[SIZES_EVENT_INDEX] > revision
        ) {
            revision = this._eventRevisions[SIZES_EVENT_INDEX];
        }
        return revision;
    }

    /** Queue or immediately publish one event flag. */
    _emit(event: VirtualScrollerEvent) {
        if (this._batchLevel > 0) {
            this._batchedEvents |= event;
        } else {
            const index =
                event === VirtualScrollerEvent.RANGE
                    ? RANGE_EVENT_INDEX
                    : event === VirtualScrollerEvent.SCROLL_SIZE
                      ? SCROLL_SIZE_EVENT_INDEX
                      : SIZES_EVENT_INDEX;
            this._eventRevisions[index] = ++this._revision;
            this._notify(event);
        }
    }

    /** Open a nestable synchronous event batch. */
    _beginBatch() {
        this._batchLevel++;
    }

    /** Close one event batch and publish at the outermost boundary. */
    _endBatch() {
        assert(
            this._batchLevel > 0,
            VirtualScrollerErrorIndex.BATCH_INVARIANT,
            1,
            this._batchLevel
        );

        this._batchLevel--;
        if (this._batchLevel > 0) return;

        const events = this._batchedEvents;
        this._batchedEvents = 0;

        try {
            // Stryker disable next-line ConditionalExpression,EqualityOperator: publishing mask 0 only increments an internal counter and scans no matching subscriptions; the guard keeps empty batches lean.
            if (events !== 0) {
                const revision = ++this._revision;
                if (events & VirtualScrollerEvent.RANGE) {
                    this._eventRevisions[RANGE_EVENT_INDEX] = revision;
                }
                if (events & VirtualScrollerEvent.SCROLL_SIZE) {
                    this._eventRevisions[SCROLL_SIZE_EVENT_INDEX] = revision;
                }
                if (events & VirtualScrollerEvent.SIZES) {
                    this._eventRevisions[SIZES_EVENT_INDEX] = revision;
                }
                this._notify(events);
            }
        } finally {
            this._onBatchEnd();
        }
    }

    /** Release callbacks retained by the dispatcher. */
    _dispose() {
        this._subscriptions = createSubscriptionList();
        this._batchedEvents = 0;
    }

    /** Synchronously notify subscriptions selected by an event mask. */
    private _notify(events: VirtualScrollerEventMask) {
        const subscriptions = this._subscriptions;
        for (let i = 0, length = subscriptions.length; i < length; i++) {
            const subscription = subscriptions[i]!;
            if (subscription.events & events) subscription.callback();
        }
    }
}

export default VirtualScrollerEvents;
