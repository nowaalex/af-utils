import useComponentSubscription from "hooks/useComponentSubscription";

const Subscription = ({ model, children, events }) => (
    useComponentSubscription(model, events), children()
);

export default Subscription;
