import useComponentSubscription from "hooks/useComponentSubscription";
import type { ReactNode } from "react";
import type { SubscriptionProps } from "types";

/**
 * @public
 * React component.
 * Rerenders only on certain {@link @af-utils/virtual-core#(VirtualScrollerEvent:variable)}.
 * Allows to optimize performance.
 */
const Subscription = (props: SubscriptionProps): ReactNode => {
    useComponentSubscription(props.model, props.events);
    return props.children();
};

export default Subscription;
