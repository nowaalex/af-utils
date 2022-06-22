import { memo, useCallback } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import { EVT_ALL } from "constants";

const Subscription = ({ model, children, getHash, events = EVT_ALL }) => (
    useSyncExternalStore(
        useCallback(listener => model.on(listener, events)[events]),
        getHash,
        getHash
    ),
    children(model)
);

export default memo(Subscription);
