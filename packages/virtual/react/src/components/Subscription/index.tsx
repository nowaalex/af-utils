import useComponentSubscription from "hooks/useComponentSubscription";
import type { SubscriptionProps } from "types";

const Subscription = (props: SubscriptionProps) => {
    useComponentSubscription(props.model, props.events);
    return props.children();
};

export default Subscription;
