import useComponentSubscription from "hooks/useComponentSubscription";
import type List from "models/VirtualScroller";
import type { Event } from "constants/";

type SubscriptionProps = {
    model: List;
    events: Event[];
    children: () => JSX.Element;
};

const Subscription = (props: SubscriptionProps) => {
    useComponentSubscription(props.model, props.events);
    return props.children();
};

export default Subscription;
