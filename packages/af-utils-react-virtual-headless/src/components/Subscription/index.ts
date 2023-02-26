import useComponentSubscription from "hooks/useComponentSubscription";
import List from "models/List";
import { Event } from "constants/";
import type { ReactNode } from "react";

type SubscriptionProps = {
    model: List;
    events: Array<Event>;
    children: () => ReactNode;
};

const Subscription = (props: SubscriptionProps) => (
    useComponentSubscription(props.model, props.events), props.children()
);

export default Subscription;
