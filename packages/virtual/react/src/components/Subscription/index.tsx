import useComponentSubscription from "hooks/useComponentSubscription";
import type { ReactNode } from "react";
import type { SubscriptionProps } from "types";

/**
 * @public
 * React component.
 * Rerenders only on certain {@link @af-utils/virtual-core#(VirtualScrollerEvent:variable)}.
 * Allows to optimize performance.
 *
 * @privateRemarks
 * TODO: convert to arrow function when https://github.com/microsoft/rushstack/issues/1629 gets solved
 */
function Subscription(props: SubscriptionProps): ReactNode {
    useComponentSubscription(props.model, props.events);
    return props.children();
}

export default Subscription;
