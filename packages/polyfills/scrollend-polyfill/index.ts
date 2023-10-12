/**
 * @packageDocumentation
 * Polyfills `scrollend` event for {@link @af-utils/scrollend-polyfill#PolyfilledTarget}.
 *
 * @remarks
 * Scroll is considered ended when touch events are not active ( user released touch )
 * and `scroll` event was not fired within {@link SCROLL_DEBOUNCE_INTERVAL} since last invocation.
 * Does nothing when used in `node` environment.
 */

/**
 * @public
 * debounce interval in milliseconds for attached `scroll` event.
 *
 * @remarks
 * exported this just for api-extractor documentation, should not be used normally
 */
export const SCROLL_DEBOUNCE_INTERVAL = 100;

/**
 * @public
 * Targets to monkey-patch `addEventListener` / `removeEventListener`.
 *
 * @remarks
 * exported this just for api-extractor documentation, should not be used normally
 */
export type PolyfilledTarget = HTMLElement | Window | Document;

/** @internal */
type MethodOf<T extends object> = (this: T, ...args: unknown[]) => unknown;

const SCROLLEND_EVENT = "scrollend";

if (typeof window !== "undefined" && !("on" + SCROLLEND_EVENT in window)) {
    const dispatchedEvent = new Event(SCROLLEND_EVENT);

    const pointers = new Set<number>();
    const handlersMap = new WeakMap<() => void, ReturnType<typeof debounce>>();

    let lastTarget: PolyfilledTarget | null = null;

    const dispatchScrollEvent = (target: PolyfilledTarget) =>
        target.dispatchEvent(dispatchedEvent);

    addEventListener(
        "touchstart",
        e => {
            for (const touch of e.changedTouches) {
                pointers.add(touch.identifier);
            }
        },
        { passive: true }
    );

    addEventListener(
        "touchend",
        e => {
            for (const touch of e.changedTouches) {
                if (
                    pointers.delete(touch.identifier) &&
                    lastTarget &&
                    !pointers.size
                ) {
                    dispatchScrollEvent(lastTarget);
                    lastTarget = null;
                }
            }
        },
        { passive: true }
    );

    const debounce = (fn: () => void, delay: number) => {
        let timer: ReturnType<typeof setTimeout> | 0 = 0;

        const cancel = () => clearTimeout(timer);

        const result = () => {
            cancel();
            timer = setTimeout(fn, delay);
        };

        result._cancel = cancel;

        return result;
    };

    const patchScrollEnd = <T extends object, K extends keyof T>(
        object: T,
        method: K,
        fn: MethodOf<T>
    ) => {
        const originalMethod = object[method] as MethodOf<T>;

        (object[method] as MethodOf<T>) = function (this: T) {
            originalMethod.apply(this, arguments as any);
            if (arguments[0] === SCROLLEND_EVENT) {
                fn.apply(this, arguments as any);
            }
        };
    };

    function onAdd(
        this: PolyfilledTarget,
        type: any,
        listener: any,
        options: any
    ) {
        const fn = debounce(() => {
            if (pointers.size === 0) {
                dispatchScrollEvent(this);
            } else {
                lastTarget = this;
            }
        }, SCROLL_DEBOUNCE_INTERVAL);
        handlersMap.set(listener, fn);
        this.addEventListener("scroll", fn, options);
    }

    function onRemove(
        this: PolyfilledTarget,
        type: any,
        listener: any,
        options: any
    ) {
        const fn = handlersMap.get(listener);
        if (fn) {
            fn._cancel();
            handlersMap.delete(listener);
            if (lastTarget === this) {
                lastTarget = null;
            }
            this.removeEventListener("scroll", fn, options);
        }
    }

    const targets = [
        HTMLElement.prototype,
        window,
        document
    ] as const satisfies readonly PolyfilledTarget[];

    targets.forEach(tgt => {
        patchScrollEnd(tgt, "addEventListener", onAdd);
        patchScrollEnd(tgt, "removeEventListener", onRemove);
    });
}
