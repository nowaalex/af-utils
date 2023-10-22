const SCROLL_DEBOUNCE_INTERVAL = 100;

type PolyfilledTarget = HTMLElement | Window | Document;

type ListenerMethod = "addEventListener" | "removeEventListener";

type PossibleListenerType = Parameters<PolyfilledTarget[ListenerMethod]>[1];

const SCROLLEND_EVENT = "scrollend";

let set = false;

if (
    !set &&
    typeof window !== "undefined" &&
    !("on" + SCROLLEND_EVENT in window)
) {
    set = true;

    const dispatchedEvent = new Event(SCROLLEND_EVENT);

    const pointers = new Set<number>();

    const handlersMap = new WeakMap<
        PossibleListenerType,
        ReturnType<typeof debounce>
    >();

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

    const patchScrollEnd = <T extends ListenerMethod>(
        objects: readonly PolyfilledTarget[],
        method: T,
        fn: (
            this: PolyfilledTarget,
            type: string,
            listener: PossibleListenerType,
            options?: AddEventListenerOptions
        ) => void
    ) =>
        objects.forEach(object => {
            const originalMethod = object[method];

            object[method] = function () {
                originalMethod.apply(this, arguments as any);
                if (arguments[0] === SCROLLEND_EVENT) {
                    fn.apply(this, arguments as any);
                }
            };
        });

    const targets = [
        HTMLElement.prototype,
        window,
        document
    ] as const satisfies readonly PolyfilledTarget[];

    patchScrollEnd(
        targets,
        "addEventListener",
        function (type, listener, options) {
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
    );
    patchScrollEnd(
        targets,
        "removeEventListener",
        function (type, listener, options) {
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
    );
}
