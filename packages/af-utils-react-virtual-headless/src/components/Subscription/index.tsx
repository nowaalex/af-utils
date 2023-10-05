import useComponentSubscription from "hooks/useComponentSubscription";
import type List from "models/VirtualScroller";
import type { Event } from "constants/";
import type { ReactNode } from "react";

type SubscriptionProps = {
    model: List;
    children: () => ReactNode;
    events?: Event[];
};

const Subscription = (props: SubscriptionProps) => {
    useComponentSubscription(props.model, props.events);
    return props.children();
};

export default Subscription;
