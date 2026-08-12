const SCROLL_DEBOUNCE_INTERVAL = 100;

type PolyfilledTarget = HTMLElement | Window | Document;
type PossibleListener = EventListenerOrEventListenerObject | null;
type ActiveListener = Exclude<PossibleListener, null>;

const SCROLLEND_EVENT = "scrollend";

const debounce = (fn: () => void, delay: number) => {
    let timer: ReturnType<typeof setTimeout> | 0 = 0;

    const cancel = () => {
        clearTimeout(timer);
        timer = 0;
    };

    const result = () => {
        cancel();
        timer = setTimeout(() => {
            timer = 0;
            fn();
        }, delay);
    };

    result._cancel = cancel;

    return result;
};

type DebouncedHandler = ReturnType<typeof debounce>;

interface ListenerRegistration {
    readonly wrapper: EventListener;
    readonly signal: AbortSignal | null;
    readonly abortHandler: (() => void) | null;
}

interface TargetState {
    readonly listeners: Map<
        ActiveListener,
        [ListenerRegistration | null, ListenerRegistration | null]
    >;
    readonly scrollHandler: DebouncedHandler;
    readonly removeEventListener: typeof EventTarget.prototype.removeEventListener;
    listenerCount: number;
    scrollPending: boolean;
}

const PATCH_MARK = Symbol.for("@af-utils/scrollend-polyfill/patched");

const getCapture = (
    options?: boolean | AddEventListenerOptions | EventListenerOptions
) =>
    Number(typeof options === "boolean" ? options : !!options?.capture) as
        | 0
        | 1;

if (
    typeof window !== "undefined" &&
    !("on" + SCROLLEND_EVENT in window) &&
    !(window as unknown as { [key: symbol]: unknown })[PATCH_MARK]
) {
    Object.defineProperty(window, PATCH_MARK, { value: true });
    const pointers = new Set<number>();
    const targetStates = new WeakMap<PolyfilledTarget, TargetState>();
    const touchPendingTargets = new Set<PolyfilledTarget>();

    const dispatchScrollEnd = (target: PolyfilledTarget) =>
        target.dispatchEvent(new Event(SCROLLEND_EVENT));

    const finishScroll = (target: PolyfilledTarget) => {
        const state = targetStates.get(target);
        touchPendingTargets.delete(target);
        if (!state?.scrollPending) return;

        state.scrollHandler._cancel();
        state.scrollPending = false;
        dispatchScrollEnd(target);
    };

    addEventListener(
        "touchstart",
        e => {
            for (const touch of e.changedTouches) {
                pointers.add(touch.identifier);
            }
        },
        { passive: true }
    );

    const handleTouchEnd = (e: TouchEvent) => {
        let changed = false;
        for (const touch of e.changedTouches) {
            changed = pointers.delete(touch.identifier) || changed;
        }

        if (changed && pointers.size === 0) {
            for (const target of touchPendingTargets) {
                finishScroll(target);
            }
        }
    };

    addEventListener("touchend", handleTouchEnd, { passive: true });
    addEventListener("touchcancel", handleTouchEnd, { passive: true });

    const deleteRegistration = (
        target: PolyfilledTarget,
        listener: ActiveListener,
        capture: 0 | 1
    ) => {
        const state = targetStates.get(target);
        const registrations = state?.listeners.get(listener);
        const registration = registrations?.[capture];
        if (!state || !registrations || !registration) return null;

        registrations[capture] = null;
        if (registration.signal && registration.abortHandler) {
            registration.signal.removeEventListener(
                "abort",
                registration.abortHandler
            );
        }
        if (!registrations[0] && !registrations[1]) {
            state.listeners.delete(listener);
        }

        if (--state.listenerCount === 0) {
            state.scrollHandler._cancel();
            state.scrollPending = false;
            touchPendingTargets.delete(target);
            state.removeEventListener.call(
                target,
                "scroll",
                state.scrollHandler
            );
            targetStates.delete(target);
        }

        return registration;
    };

    const ensureTargetState = (
        target: PolyfilledTarget,
        originalAdd: typeof EventTarget.prototype.addEventListener,
        originalRemove: typeof EventTarget.prototype.removeEventListener
    ) => {
        let state = targetStates.get(target);
        if (state) return state;

        let nextState: TargetState;
        const finishHandler = debounce(() => {
            if (!nextState.scrollPending) return;
            if (pointers.size === 0) finishScroll(target);
            else touchPendingTargets.add(target);
        }, SCROLL_DEBOUNCE_INTERVAL);
        const scrollHandler = Object.assign(
            () => {
                touchPendingTargets.delete(target);
                nextState.scrollPending = true;
                finishHandler();
            },
            { _cancel: finishHandler._cancel }
        );

        nextState = state = {
            listeners: new Map(),
            scrollHandler,
            removeEventListener: originalRemove,
            listenerCount: 0,
            scrollPending: false
        };
        targetStates.set(target, state);
        originalAdd.call(target, "scroll", scrollHandler, {
            passive: true
        });
        return state;
    };

    const patchTarget = (object: PolyfilledTarget) => {
        const originalAdd = object.addEventListener;
        const originalRemove = object.removeEventListener;

        object.addEventListener = function (
            type: string,
            listener: PossibleListener,
            options?: boolean | AddEventListenerOptions
        ) {
            if (listener === null) return;
            if (type !== SCROLLEND_EVENT) {
                originalAdd.call(this, type, listener, options);
                return;
            }

            const capture = getCapture(options);
            const state = targetStates.get(this);
            if (state?.listeners.get(listener)?.[capture]) return;

            const signal =
                typeof options === "object" ? (options.signal ?? null) : null;
            if (signal?.aborted) return;

            const once = typeof options === "object" && !!options.once;
            const wrapper: EventListener = event => {
                if (once) deleteRegistration(this, listener, capture);

                if (typeof listener === "function") {
                    listener.call(this, event);
                } else {
                    listener.handleEvent(event);
                }
            };
            const abortHandler = signal
                ? () => deleteRegistration(this, listener, capture)
                : null;
            const registration: ListenerRegistration = {
                wrapper,
                signal,
                abortHandler
            };

            originalAdd.call(this, type, wrapper, options);
            const nextState = ensureTargetState(
                this,
                originalAdd,
                originalRemove
            );
            const registrations = nextState.listeners.get(listener) ?? [
                null,
                null
            ];
            registrations[capture] = registration;
            nextState.listeners.set(listener, registrations);
            nextState.listenerCount++;
            if (signal && abortHandler) {
                signal.addEventListener("abort", abortHandler, { once: true });
            }
        };

        object.removeEventListener = function (
            type: string,
            listener: PossibleListener,
            options?: boolean | EventListenerOptions
        ) {
            if (listener === null) return;
            if (type !== SCROLLEND_EVENT) {
                originalRemove.call(this, type, listener, options);
                return;
            }

            const registration = deleteRegistration(
                this,
                listener,
                getCapture(options)
            );
            originalRemove.call(
                this,
                type,
                registration?.wrapper ?? listener,
                options
            );
        };
    };

    patchTarget(HTMLElement.prototype);
    patchTarget(window);
    patchTarget(document);
}
