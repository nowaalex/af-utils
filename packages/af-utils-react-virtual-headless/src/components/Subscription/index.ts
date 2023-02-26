import useComponentSubscription from "hooks/useComponentSubscription";
import List from "models/List";
import type { ReactNode } from "react";

interface SubscriptionProps {
    model: List;
    events: Array<number>;
    children: () => ReactNode;
}

const Subscription = (props: SubscriptionProps) => (
    useComponentSubscription(props.model, props.events), props.children()
);

export default Subscription;
