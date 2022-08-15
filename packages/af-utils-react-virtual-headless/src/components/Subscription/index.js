import useComponentSubscription from "hooks/useComponentSubscription";

const Subscription = props => (
    useComponentSubscription(props.model, props.events), props.children()
);

export default Subscription;
